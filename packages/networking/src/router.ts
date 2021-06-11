import {DependencyContainer, inject, singleton} from "tsyringe";
import {Request} from "./models/request";
import {Response} from "./models/response";
import {UrlUtil} from "./utils/url.util";
import {NotFoundHttpError} from "./errors/not-found.http-error";
import {RouterInterface} from "./interfaces/router.interface";
import {RouterNode} from "./nodes/router.node";
import {PathRouterNode} from "./nodes/path-router.node";
import {Route} from "./models/route";
import {MethodRouterNode} from "./nodes/method-router.node";
import {ForbiddenHttpError} from "./errors/forbidden.http-error";
import {ControllerMethodParameterDecoratorResolver} from "./resolvers/controller-method-parameter-decorator.resolver";
import Url from 'url-parse';
import {HttpMethod, IdentityInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {AuthenticationManagerInterface, AuthorizerManagerInterface} from "@pristine-ts/security";
import {RouterResponseEnricherInterface} from "./interfaces/router-response-enricher.interface";
import {RouterRequestEnricherInterface} from "./interfaces/router-request-enricher.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";

@singleton()
export class Router implements RouterInterface {
    private root: RouterNode = new PathRouterNode("/");

    public constructor( @inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface,
                        private readonly controllerMethodParameterDecoratorResolver: ControllerMethodParameterDecoratorResolver,
                        @inject("AuthorizerManagerInterface") private readonly authorizerManager: AuthorizerManagerInterface,
                        @inject("AuthenticationManagerInterface") private readonly authenticationManager: AuthenticationManagerInterface) {
    }

    /**
     * This method registers a Route into the Route Tree maintained by the router.
     *
     * @param path
     * @param method
     * @param route
     */
    public register(path: string, method: HttpMethod | string, route: Route) {
        const splitPaths = UrlUtil.splitPath(path);

        this.root.add(splitPaths, method, route);
    }

    /**
     * This method receives a Request object, identifies the "path" its trying to hit, navigates the internally
     * maintained Route Tree, identifies the method in the controller that represents this "path", and calls the
     * method with the specified parameters.
     *
     * @param request
     * @param container
     */
    public execute(request: Request, container: DependencyContainer): Promise<Response> {
        return new Promise<Response>(async (resolve, reject) => {
            // Start by decomposing the URL. Set second parameter to true since we want to parse the query strings
            const url = new Url(request.url, false);

            // Split the path name
            const splitPath = UrlUtil.splitPath(url.pathname);

            // Retrieve the node to have information about the controller
            const methodNode: MethodRouterNode = this.root.find(splitPath, request.httpMethod) as MethodRouterNode;

            this.loghandler.debug("Execute request", {
                rootNode: this.root,
                request,
                url,
                methodNode,
            });

            // If node doesn't exist, throw a 404 error
            if(methodNode === null) {
                this.loghandler.error("Cannot find the path", {
                    rootNode: this.root,
                    request,
                    url,
                });

                return reject(new NotFoundHttpError("No route found for path: '" + url.pathname + "'."));
            }

            // Get the route parameters
            const routeParameters = (methodNode.parent as PathRouterNode).getRouteParameters(splitPath.reverse());

            // Instantiate the controller
            const controller: any = container.resolve(methodNode.route.controllerInstantiationToken);

            this.loghandler.debug("Before calling the authenticationManager", {
                controller,
                routeParameters
            });

            let identity: IdentityInterface | undefined;

            try {
                identity = await this.authenticationManager.authenticate(request, methodNode.route.context, container);

                this.loghandler.debug("Found identity.", {
                    identity
                });
            } catch (error) {
                this.loghandler.error("Authentication error", {
                    error,
                    request,
                    context: methodNode.route.context,
                    container
                });

                // Todo: check if the error is an UnauthorizedHttpError, else create one.
                if(error instanceof ForbiddenHttpError === false){
                    error = new ForbiddenHttpError("You are not allowed to access this.");
                }
                return reject(error);
            }

            // Call the controller with the resolved Method arguments
            try {

                if(await this.authorizerManager.isAuthorized(request, methodNode.route.context, container, identity) === false) {
                    this.loghandler.error("User not authorized to access this url.", {
                        request,
                        context: methodNode.route.context,
                        container,
                        identity
                    });

                    return reject(new ForbiddenHttpError("You are not allowed to access this."));
                }

                const enrichedRequest = await this.executeRequestEnrichers(request, container, methodNode);

                this.loghandler.debug("This request has been enriched", {
                    request,
                    enrichedRequest,
                })

                const resolvedMethodArguments: any[] = [];

                for (const methodArgument of methodNode.route.methodArguments) {
                    resolvedMethodArguments.push(await this.controllerMethodParameterDecoratorResolver.resolve(methodArgument, enrichedRequest, routeParameters, identity));
                }

                this.loghandler.debug("Controller argument resolved", {
                    resolvedMethodArguments,
                })

                const controllerResponse = controller[methodNode.route.methodPropertyKey].apply(controller, resolvedMethodArguments);

                // This resolves the promise if it's a promise or promisifies the value
                // https://stackoverflow.com/a/27760489/684101
                const response = await Promise.resolve(controllerResponse);

                this.loghandler.debug("The returned response by the controller", {
                    response
                })

                let returnedResponse: Response;
                // If the response is already a Response object, return the response
                if(response instanceof Response) {
                    returnedResponse = response;
                } else {
                    // If the response is not a response object, but the method hasn't thrown an error, assume the
                    // returned response is directly the body. Also assume an Http Status code of 200.
                    returnedResponse = new Response();
                    returnedResponse.status = 200;
                    returnedResponse.body = response;
                }
                const enrichedResponse = await this.executeResponseEnrichers(returnedResponse, request, container, methodNode);

                this.loghandler.debug("This response has been enriched", {
                    returnedResponse,
                    enrichedResponse,
                })

                return resolve(returnedResponse);
            }
            catch (error) {
                this.loghandler.error("There was an error trying to execute the request in the router", {
                    error,
                })

                return reject(error);
            }
        })
    }

    /**
     * This method executes all the Router response enrichers and returns the response updated by the enrichers.
     *
     * @param response
     * @param request
     * @param container
     * @param methodNode
     * @private
     */
    private async executeResponseEnrichers(response: Response, request: Request, container: DependencyContainer, methodNode: MethodRouterNode): Promise<Response> {
        // Execute all the request enrichers
        let enrichedResponse = response;

        // Check first if there are any Router Response enrichers
        if (container.isRegistered(ServiceDefinitionTagEnum.RouterResponseEnricher, true)) {
            const enrichers: any[] = container.resolveAll(ServiceDefinitionTagEnum.RouterResponseEnricher);

            for (const enricher of enrichers) {
                // We don't have a guarantee that the Router response enrichers will implement the Interface, even though we specify it should.
                // So, we have to verify that the method exists, and if it doesn't we throw
                if (typeof enricher.enrichResponse === "undefined") {
                    //todo should we type this error ?
                    throw new Error("The Router Response Enricher named: '" + enricher.constructor.name + "' doesn't have the 'enrichResponse' method. RouterResponseEnrichers should implement the RouterResponseEnricher interface.")
                }

                try {
                    // https://stackoverflow.com/a/27760489/684101
                    enrichedResponse = await Promise.resolve((enricher as RouterResponseEnricherInterface).enrichResponse(enrichedResponse, request, methodNode));
                } catch (e) {
                    this.loghandler.error("There was an exception thrown while executing the 'enrichResponse' method of the RouterResponseEnricher named: '" + enricher.constructor.name + "'.", {e});
                    throw e;
                }
            }
        }

        return enrichedResponse;
    }

    /**
     * This method executes all the Router request enrichers and returns the request updated by the enrichers.
     *
     * @param request
     * @param container
     * @param methodNode
     * @private
     */
    private async executeRequestEnrichers( request: Request, container: DependencyContainer, methodNode: MethodRouterNode): Promise<Request> {
        // Execute all the request enrichers
        let enrichedRequest = request;

        // Check first if there are any Router Request enrichers
        if (container.isRegistered(ServiceDefinitionTagEnum.RouterRequestEnricher, true)) {
            const enrichers: any[] = container.resolveAll(ServiceDefinitionTagEnum.RouterRequestEnricher);

            for (const enricher of enrichers) {
                // We don't have a guarantee that the Router response enrichers will implement the Interface, even though we specify it should.
                // So, we have to verify that the method exists, and if it doesn't we throw
                if (typeof enricher.enrichRequest === "undefined") {
                    //todo should we type this error ?
                    throw new Error("The Router Request Enricher named: '" + enricher.constructor.name + "' doesn't have the 'enrichRequest' method. RouterRequestEnrichers should implement the RouterRequestEnricher interface.")
                }

                try {
                    // https://stackoverflow.com/a/27760489/684101
                    enrichedRequest = await Promise.resolve((enricher as RouterRequestEnricherInterface).enrichRequest(enrichedRequest, methodNode));
                } catch (e) {
                    this.loghandler.error("There was an exception thrown while executing the 'enrichedRequest' method of the RouterRequestEnricher named: '" + enricher.constructor.name + "'.", {e});
                    throw e;
                }
            }
        }

        return enrichedRequest;
    }
}
