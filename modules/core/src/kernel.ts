import "reflect-metadata";
import {container, DependencyContainer, isClassProvider, ValueProvider} from "tsyringe";
import {ModuleInterface} from "./interfaces/module.interface";
import {ProviderRegistration} from "./types/provider-registration.type";
import {InitializationError} from "./errors/initialization.error";
import {Event} from "./interfaces/event.interface";
import {Response} from "./network/response";
import {Request} from "./network/request";
import {Router} from "./network/router";
import {controllerRegistry} from "./decorators/controller.decorator";
import {MethodDecoratorRoute} from "./interfaces/method-decorator-route.interface";
import {RouteInformation} from "./network/route-information";
import {ServiceDefinitionTagEnum} from "./enums/service-definition-tag.enum";
import {RuntimeError} from "./errors/runtime.error";
import {RequestInterceptorInterface} from "./interfaces/request-interceptor.interface";
const util = require('util');

export class Kernel {
    public container: DependencyContainer = container;

    private router: Router;

    public constructor() {}

    public async init(module: ModuleInterface) {
        await this.initModule(module);

        // Setup the router
        this.setupRouter();
    }

    /**
     * This method receives a module and recursively calls back this method with the module dependencies
     * specified as imported by the module.
     *
     * This method also registers all the service definitions in the container.
     *
     * @param module
     * @private
     */
    private async initModule(module: ModuleInterface) {
        // Start by recursively importing all the modules
        for (let importedModule of module.importModules) {
            await this.initModule(importedModule)
        }

        // Add all the providers to the container
        module.providerRegistrations.forEach( (providerRegistration: ProviderRegistration) => {
            const args = [
                providerRegistration.token,
                providerRegistration,
            ];

            if(providerRegistration.hasOwnProperty("options")) {
                args.push(providerRegistration["options"]);
            }

            try {
                // Register the provider in the container
                this.container.register.apply(this.container, args);
            }
            catch (e) {
                throw new InitializationError("There was an error registering the following providerRegistration: " + util.inspect(providerRegistration, false, 4), e)
            }
        })
    }

    /**
     * This method loops through the all the classes decorated with @controller, loops through all the methods decorated
     * with @route and builds the dependency tree of all the routes.
     *
     * @private
     */
    private setupRouter() {
        this.router = this.container.resolve(Router);

        // Init the controllers
        controllerRegistry.forEach(controller => {
            let basePath: string = controller.__metadata__?.controller?.basePath;

            if(basePath.endsWith("/")) {
                basePath = basePath.slice(0, basePath.length-1);
            }

            for (const methodPropertyKey in controller.__metadata__?.methods) {
                if(controller.__metadata__?.methods?.hasOwnProperty(methodPropertyKey) === false) {
                    continue;
                }

                const method = controller.__metadata__?.methods[methodPropertyKey];

                if(method.hasOwnProperty("route") === false) {
                    continue;
                }

                // Retrieve the "MethodDecoratorRoute" object assigned by the @route decorator at .route
                const route: MethodDecoratorRoute = method.route;

                // Build the RouteInformation object that will be used the the router to dispatch a request to
                // the appropriate controller method
                const routeInformation: RouteInformation = new RouteInformation(controller.constructor, route.propertyKey);
                routeInformation.methodArguments = method.arguments ?? [];

                // Build the proper path
                let path = route.path;

                // Clean the path by removing the first and trailing slashes.
                if(path.startsWith("/")) {
                    path = path.slice(1, path.length);
                }

                if(path.endsWith("/")) {
                    path = path.slice(0, path.length-1);
                }

                // Build the proper path
                const routePath = basePath + "/" + path;

                // Register the route
                this.router.register(routePath, route.httpMethod, routeInformation);
            }
        })
    }

    /**
     * 
     * @param event
     */
    public async handleEvent(event: Event) {
        // Start by creating a child container and we will use this container to instantiate the dependencies for this event
        const childContainer = this.container.createChildContainer();


        // Return

    }

    /**
     *
     * @param request
     * @param container
     * @private
     */
    private async executeRequestInterceptors(request: Request, container: DependencyContainer): Promise<Request> {
        // Execute all the request interceptors
        let interceptedRequest = request;

        // Check first if there are any RequestInterceptors
        if(container.isRegistered(ServiceDefinitionTagEnum.RequestInterceptor)) {
            const interceptors = container.resolveAll(ServiceDefinitionTagEnum.RequestInterceptor);

            for (const interceptor of interceptors) {
                // We don't have a guarantee that the request interceptors will implement the Interface, even though we specify it should.
                // So, we have to verify that the method exists, and if it doesn't we throw
                if(interceptor.hasOwnProperty("interceptRequest") === false) {
                    throw new RuntimeError("The Request Interceptor named: '" + interceptor.constructor.name + "' doesn't have the 'interceptRequest' method. RequestInterceptors should implement the RequestInterceptor interface.")
                }

                try {
                    // https://stackoverflow.com/a/27760489/684101
                    interceptedRequest = await Promise.resolve((interceptor as RequestInterceptorInterface).interceptRequest(interceptedRequest));
                }
                catch (e) {
                    throw new RuntimeError("There was an exception thrown while executing the 'interceptRequest' method of the RequestInterceptor named: '" + interceptor.constructor.name + "'. Error thrown is: '" + e + "'.");
                }
            }
        }
    }

    /**
     *
     * @param response
     * @param request
     * @param container
     * @private
     */
    private async executeResponseInterceptors(response: Response, request: Request, container: DependencyContainer ): Promise<Response> {
        // todo: handle the response interceptors
        return new Promise(resolve => resolve(response));
    }

    /**
     *
     * @param error
     * @param request
     * @param container
     * @private
     */
    private async executeErrorResponseInterceptors(error: Error, request: Request, container: DependencyContainer): Promise<Response> {
        // todo: handle the error response interceptors
        return new Promise(resolve => resolve(new Response()));
    }

    /**
     *
     * @param request
     */
    public async handleRequest(request: Request): Promise<Response> {
        return new Promise(async (resolve) => {
            // Start by creating a child container and we will use this container to instantiate the dependencies for this request
            const childContainer = this.container.createChildContainer();

            try {
                const interceptedRequest = await this.executeRequestInterceptors(request, childContainer);

                this.router.execute(interceptedRequest, childContainer).then( async (response: Response) => {
                    // Execute all the response interceptors
                    const interceptedResponse = await this.executeResponseInterceptors(response, request, childContainer);

                    return resolve(interceptedResponse);

                }).catch(async (error) => {
                    // Transform the error into a response object
                    const errorResponse = await this.executeErrorResponseInterceptors(error, request, childContainer);

                    return resolve(errorResponse);
                });
            } catch (error) {
                // Transform the error into a response object
                const errorResponse = await this.executeErrorResponseInterceptors(error, request, childContainer);

                return resolve(errorResponse);
            }
        })
    }

}