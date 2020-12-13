import {DependencyContainer, singleton} from "tsyringe";
import {Route} from "./route";
import {RouterNode} from "./router.node";
import {PathRouterNode} from "./path-router.node";
import {HttpMethod} from "../enums/http-method.enum";
import {ControllerInstantiationOptions} from "../options/controller.instantiation-options";
import {Request} from "./request";
import {Response} from "./response";
import {UrlUtil} from "../utils/url.util";
import {NotFoundHttpError} from "../errors/not-found.http-error";
import {MethodRouterNode} from "./method-router.node";
const Url = require('url-parse');

@singleton()
export class Router {
    private root: RouterNode = new PathRouterNode("/", null);;

    public constructor() {
    }

    public register(path: string, method: HttpMethod, controllerInstantiationOptions: ControllerInstantiationOptions) {
        const splitPaths = UrlUtil.splitPath(path);

        this.root.add<ControllerInstantiationOptions>(splitPaths, method, controllerInstantiationOptions);
    }

    public execute(request: Request, container: DependencyContainer): Promise<Response> {
        // Start by decomposing the URL. Set second parameter to true since we want to parse the query strings
        const url = new Url(request.url, true);

        // Retrieve the node to have information about the controller
        const methodNode: MethodRouterNode<ControllerInstantiationOptions> = this.root.find(UrlUtil.splitPath(url.pathname), HttpMethod.Get)as MethodRouterNode<ControllerInstantiationOptions>;

        // If node doesn't exist, throw a 404 error
        if(methodNode === null) {
            throw new NotFoundHttpError("No route found for path: '" + url.pathname + "'.");
        }

        // Instantiate the controller
        const controller = container.resolve(methodNode.data.controllerInstanciationToken);

        // Execute the method of the controller

        // Check the return of the method, if it's not a promise, promisify it

        // If it's not a Response object, transform it into a response object

        // Return the response
    }

}