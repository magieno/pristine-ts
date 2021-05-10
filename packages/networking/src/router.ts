import {DependencyContainer, inject, singleton} from "tsyringe";
import {HttpMethod} from "./enums/http-method.enum";
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
import {IdentityInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {AuthenticationManagerInterface, AuthorizerManagerInterface} from "@pristine-ts/security";
import {ResponseEnhancerInterface} from "./interfaces/response-enhancer.interface";

@singleton()
export class Router implements RouterInterface {
    private root: RouterNode = new PathRouterNode("/");

    public constructor(private readonly controllerMethodParameterDecoratorResolver: ControllerMethodParameterDecoratorResolver,
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

            // If node doesn't exist, throw a 404 error
            if(methodNode === null) {
                return reject(new NotFoundHttpError("No route found for path: '" + url.pathname + "'."));
            }

            // Get the route parameters
            const routeParameters = (methodNode.parent as PathRouterNode).getRouteParameters(splitPath.reverse());

            // Instantiate the controller
            const controller: any = container.resolve(methodNode.route.controllerInstantiationToken);

            let identity: IdentityInterface | undefined;

            try {
                identity = await this.authenticationManager.authenticate(request, methodNode.route.context, container);
            } catch (e) {
                // Todo: check if the error is an UnauthorizedHttpError, else create one.
                return reject(e);
            }

            const resolvedMethodArguments: any[] = [];

            for (const methodArgument of methodNode.route.methodArguments) {
                resolvedMethodArguments.push(await this.controllerMethodParameterDecoratorResolver.resolve(methodArgument, request, routeParameters, identity));
            }

            // Call the controller with the resolved Method arguments
            try {

                if(await this.authorizerManager.isAuthorized(request, methodNode.route.context, container, identity) === false) {
                    return reject(new ForbiddenHttpError("You are not allowed to access this."));
                }

                const controllerResponse = controller[methodNode.route.methodPropertyKey].apply(controller, resolvedMethodArguments);

                // This resolves the promise if it's a promise or promisifies the value
                // https://stackoverflow.com/a/27760489/684101
                const response = await Promise.resolve(controllerResponse);

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
                returnedResponse = await this.executeResponseEnhancers(returnedResponse, request, container, methodNode);

                return resolve(returnedResponse);
            }
            catch (e) {
                return reject(e);
            }
        })
    }

    /**
     * This method executes all the response enhancers and returns the response updated by the enhancers.
     *
     * @param response
     * @param request
     * @param container
     * @param methodNode
     * @private
     */
    private async executeResponseEnhancers(response: Response, request: Request, container: DependencyContainer, methodNode: MethodRouterNode): Promise<Response> {
        // Execute all the request enhancers
        let enhancedResponse = response;

        // Check first if there are any RequestInterceptors
        if (container.isRegistered(ServiceDefinitionTagEnum.ResponseEnhancer, true)) {
            const enhancers: any[] = container.resolveAll(ServiceDefinitionTagEnum.ResponseEnhancer);

            for (const enhancer of enhancers) {
                // We don't have a guarantee that the request enhancers will implement the Interface, even though we specify it should.
                // So, we have to verify that the method exists, and if it doesn't we throw
                if (typeof enhancer.enhanceResponse === "undefined") {
                    //todo should we type this error ?
                    throw new Error("The Response Enhancer named: '" + enhancer.constructor.name + "' doesn't have the 'enhanceResponse' method. ResponseEnhancers should implement the ResponseEnhancer interface.")
                }

                try {
                    // https://stackoverflow.com/a/27760489/684101
                    enhancedResponse = await Promise.resolve((enhancer as ResponseEnhancerInterface).enhanceResponse(enhancedResponse, request, methodNode));
                } catch (e) {
                    throw new Error("There was an exception thrown while executing the 'enhanceResponse' method of the ResponseEnhancer named: '" + enhancer.constructor.name + "'. Error thrown is: '" + e + "'.");
                }
            }
        }

        return enhancedResponse;
    }
}
