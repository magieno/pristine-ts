import {DependencyContainer, singleton} from "tsyringe";
import {RouteInformation} from "./route-information";
import {RouterNode} from "./router.node";
import {PathRouterNode} from "./path-router.node";
import {HttpMethod} from "../enums/http-method.enum";
import {ControllerInstantiationOptions} from "../options/controller.instantiation-options";
import {Request} from "./request";
import {Response} from "./response";
import {UrlUtil} from "../utils/url.util";
import {NotFoundHttpError} from "../errors/not-found.http-error";
import {MethodRouterNode} from "./method-router.node";
import {ParameterDecoratorResolver} from "../resolvers/parameter-decorator.resolver";
const Url = require('url-parse');

@singleton()
export class Router {
    private root: RouterNode = new PathRouterNode("/", null);;

    public constructor() {
    }

    public register(path: string, method: HttpMethod | string, route: RouteInformation) {
        const splitPaths = UrlUtil.splitPath(path);

        this.root.add<RouteInformation>(splitPaths, method, route);
    }

    public execute(request: Request, container: DependencyContainer): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            // Start by decomposing the URL. Set second parameter to true since we want to parse the query strings
            const url = new Url(request.url, false);

            // Split the path name
            const splitPath = UrlUtil.splitPath(url.pathname);

            // Retrieve the node to have information about the controller
            const methodNode: MethodRouterNode<RouteInformation> = this.root.find(splitPath, request.httpMethod) as MethodRouterNode<RouteInformation>;

            // If node doesn't exist, throw a 404 error
            if(methodNode === null) {
                throw new NotFoundHttpError("No route found for path: '" + url.pathname + "'.");
            }

            // Get the route parameters
            const routeParameters = (methodNode.parent as PathRouterNode).getRouteParameter(splitPath.reverse());

            // Instantiate the controller
            const controller: any = container.resolve(methodNode.data.controllerInstantiationToken);

            // Execute the httpMethod of the controller
            const routeInformation = methodNode.data as RouteInformation;

            const resolvedMethodArguments = [];

            routeInformation.methodArguments.forEach(methodArgument => {
                resolvedMethodArguments.push(ParameterDecoratorResolver.resolve(methodArgument, request, routeParameters));
            });

            // Call the controller with the resolved Method arguments
            try {
                const controllerResponse = controller[routeInformation.methodPropertyKey].apply(controller, resolvedMethodArguments);

                // This resolves the promise if it's a promise or promisifies the value
                // https://stackoverflow.com/a/27760489/684101
                Promise.resolve(controllerResponse).then((response) => {
                    // If the response is already a Response object, return the response
                    if(response instanceof Response) {
                        return resolve(response);
                    }

                    // If the response is not a response object, but the method hasn't thrown an error, assume the
                    // returned response is directly the body. Also assume an Http Status code of 200.
                    const returnedResponse = new Response();
                    returnedResponse.status = 200;
                    returnedResponse.body = response;

                    return resolve(returnedResponse);
                })
            }
            catch (e) {
                return reject(e);
            }
        })
    }

}