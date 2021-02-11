import "reflect-metadata";
import {container, DependencyContainer, isClassProvider, ValueProvider} from "tsyringe";
import {ModuleInterface} from "./interfaces/module.interface";
import {ProviderRegistration} from "./types/provider-registration.type";
import {InitializationError} from "./errors/initialization.error";
import {Response, Request, Router, controllerRegistry, GuardInitializationError, RouteMethodDecorator, RequestInterface, RouterInterface, Route, HttpError} from "@pristine-ts/networking";
import {ModuleConfiguration, ConfigurationParser } from "@pristine-ts/configuration";
import {Event } from "@pristine-ts/event";
import {RuntimeError} from "./errors/runtime.error";
import {RequestInterceptorInterface} from "./interfaces/request-interceptor.interface";
import {ResponseInterceptorInterface} from "./interfaces/response-interceptor.interface";
import {ErrorResponseInterceptorInterface} from "./interfaces/error-response-interceptor.interface";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {EventTransformer, EventDispatcher} from "@pristine-ts/event";
const util = require('util');

/**
 * This is the central class that manages the lifecyle of this library.
 */
export class Kernel {
    /**
     * Contains a reference to the root Dependency Injection Container.
     */
    public container: DependencyContainer = container.createChildContainer();

    /**
     * Contains a reference to the Router. It is undefined until this.setupRouter() is called.
     * @private
     */
    private router?: RouterInterface;

    public constructor() {}

    public async init(module: ModuleInterface, moduleConfigurations: ModuleConfiguration<any>[] = []) {
        await this.initModule(module, moduleConfigurations);

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
     * @param moduleConfigurations
     * @private
     */
    private async initModule(module: ModuleInterface, moduleConfigurations: ModuleConfiguration<any>[] = []) {
        if(module.importModules) {
            // Start by recursively importing all the packages
            for (let importedModule of module.importModules) {
                await this.initModule(importedModule, moduleConfigurations);
            }
        }

        // Add all the providers to the container
        if(module.providerRegistrations) {
            module.providerRegistrations.forEach( (providerRegistration: ProviderRegistration) => {
                const args = [
                    providerRegistration.token,
                    providerRegistration,
                ];

                if(providerRegistration.hasOwnProperty("options")) {
                    // Ignore this since even if we check for the property to exist, it complains.
                    // @ts-ignore
                    args.push(providerRegistration.options);
                }

                try {
                    // Register the provider in the container
                    // @ts-ignore
                    this.container.register.apply(this.container, args);
                }
                catch (e) {
                    throw new InitializationError("There was an error registering the following providerRegistration: " + util.inspect(providerRegistration, false, 4), e)
                }
            })
        }

        // Validate the configuration with this module. If the module doesn't specify a configuration definition, then return.
        const configurationForCurrentModule = moduleConfigurations.find(moduleConfiguration => moduleConfiguration.moduleKeyname === module.keyname);

        if(module.configurationDefinition === undefined) {
            if(configurationForCurrentModule !== undefined) {
                throw new InitializationError("You passed a configuration for module: '" + module.keyname + "', but it doesn't expose a configuration.")
            }
            return;
        }

        const configurationParser: ConfigurationParser = this.container.resolve(ConfigurationParser);

        const configurationParameterInjectionTokens = await configurationParser.parse(module.configurationDefinition, configurationForCurrentModule?.configuration ?? {}, module.keyname)

        configurationParameterInjectionTokens.forEach(injectionToken => {
           this.container.register(injectionToken.parameterName, {
               useValue: injectionToken.value,
           });
        });
    }

    /**
     * This method executes all the RequestInterceptors and returns the request updated by the interceptors.
     *
     * @param request
     * @param container
     * @private
     */
    private async executeRequestInterceptors(request: Request, container: DependencyContainer): Promise<Request> {
        // Execute all the request interceptors
        let interceptedRequest = request;

        // Check first if there are any RequestInterceptors
        if(container.isRegistered(ServiceDefinitionTagEnum.RequestInterceptor, true)) {
            const interceptors: any[] = container.resolveAll(ServiceDefinitionTagEnum.RequestInterceptor);

            for (const interceptor of interceptors) {
                // We don't have a guarantee that the request interceptors will implement the Interface, even though we specify it should.
                // So, we have to verify that the method exists, and if it doesn't we throw
                if(typeof interceptor.interceptRequest === "undefined") {
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

        return interceptedRequest;
    }

    /**
     * This method executes all the response interceptors and returns the response updated by the interceptors.
     *
     * @param response
     * @param request
     * @param container
     * @private
     */
    private async executeResponseInterceptors(response: Response, request: Request, container: DependencyContainer ): Promise<Response> {
        // Execute all the request interceptors
        let interceptedResponse = response;

        // Check first if there are any RequestInterceptors
        if(container.isRegistered(ServiceDefinitionTagEnum.ResponseInterceptor, true)) {
            const interceptors: any[] = container.resolveAll(ServiceDefinitionTagEnum.ResponseInterceptor);

            for (const interceptor of interceptors) {
                // We don't have a guarantee that the request interceptors will implement the Interface, even though we specify it should.
                // So, we have to verify that the method exists, and if it doesn't we throw
                if(typeof interceptor.interceptResponse === "undefined") {
                    throw new RuntimeError("The Response Interceptor named: '" + interceptor.constructor.name + "' doesn't have the 'interceptResponse' method. ResponseInterceptors should implement the ResponseInterceptor interface.")
                }

                try {
                    // https://stackoverflow.com/a/27760489/684101
                    interceptedResponse = await Promise.resolve((interceptor as ResponseInterceptorInterface).interceptResponse(interceptedResponse, request));
                }
                catch (e) {
                    throw new RuntimeError("There was an exception thrown while executing the 'interceptResponse' method of the ResponseInterceptor named: '" + interceptor.constructor.name + "'. Error thrown is: '" + e + "'.");
                }
            }
        }

        return interceptedResponse;
    }

    /**
     * This method executes all the error response interceptors and returns the response updated by the interceptors.
     *
     * @param error
     * @param request
     * @param container
     * @private
     */
    private async executeErrorResponseInterceptors(error: Error, request: Request, container: DependencyContainer): Promise<Response> {
        // Execute all the request interceptors
        let interceptedErrorResponse = new Response();
        interceptedErrorResponse.request = request;

        if(error instanceof HttpError) {
            interceptedErrorResponse.status = (error as HttpError).httpStatus
        }
        else {
            interceptedErrorResponse.status = 500;
        }

        interceptedErrorResponse.body = {
            name: error.name,
            message: error.message,
        };

        // Check first if there are any RequestInterceptors
        if(container.isRegistered(ServiceDefinitionTagEnum.ErrorResponseInterceptor, true)) {
            const interceptors: any[] = container.resolveAll(ServiceDefinitionTagEnum.ErrorResponseInterceptor);

            for (const interceptor of interceptors) {
                // We don't have a guarantee that the request interceptors will implement the Interface, even though we specify it should.
                // So, we have to verify that the method exists, and if it doesn't we throw
                if(typeof interceptor.interceptError === "undefined") {
                    throw new RuntimeError("The Error Response Interceptor named: '" + interceptor.constructor.name + "' doesn't have the 'interceptError' method. ErrorResponseInterceptors should implement the ErrorResponseInterceptor interface.")
                }

                try {
                    // https://stackoverflow.com/a/27760489/684101
                    interceptedErrorResponse = await Promise.resolve((interceptor as ErrorResponseInterceptorInterface).interceptError(error, request, interceptedErrorResponse));
                }
                catch (e) {
                    throw new RuntimeError("There was an exception thrown while executing the 'interceptError' method of the ErrorResponseInterceptors named: '" + interceptor.constructor.name + "'. Error thrown is: '" + e + "'.");
                }
            }
        }

        return interceptedErrorResponse;
    }


    /**
     *  This method takes the raw Event, transforms it into an Event object and then dispatches it to the Event Listeners
     *
     * @param rawEvent
     */
    public async handleRawEvent(rawEvent: object): Promise<void> {
        // Start by creating a child container and we will use this container to instantiate the dependencies for this event
        const childContainer = this.container.createChildContainer();

        const eventTransformer: EventTransformer = childContainer.resolve(EventTransformer);
        const eventDispatcher: EventDispatcher = childContainer.resolve(EventDispatcher);

        // Transform the raw event into an object
        const event: Event = eventTransformer.transform(rawEvent);

        // Dispatch the Event to the EventListeners
        await eventDispatcher.dispatch(event);
    }

    /**
     * This method receives a requestInterface, calls the router to execute the request and returns the response. This method
     * calls all the interceptors. This should be the only point with the outside world when dealing with requests.
     *
     * @param requestInterface
     */
    public async handleRequest(requestInterface: RequestInterface): Promise<Response> {
        const request = new Request(requestInterface);

        return new Promise(async (resolve) => {
            // Check for the router to not be undefined.
            if(this.router === undefined) {
                throw new InitializationError("The Router is undefined");
            }

            // Start by creating a child container and we will use this container to instantiate the dependencies for this request
            const childContainer = this.container.createChildContainer();

            try {
                const interceptedRequest = await this.executeRequestInterceptors(request, childContainer);

                const response = await this.router.execute(interceptedRequest, childContainer);

                // Execute all the response interceptors
                const interceptedResponse = await this.executeResponseInterceptors(response, request, childContainer);

                return resolve(interceptedResponse);
            } catch (error) {
                // Transform the error into a response object
                const errorResponse = await this.executeErrorResponseInterceptors(error, request, childContainer);

                // Execute all the response interceptors
                const interceptedResponse = await this.executeResponseInterceptors(errorResponse, request, childContainer);

                return resolve(interceptedResponse);
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
            if(this.router === undefined) {
                throw new InitializationError("The Router is undefined");
            }

            if(controller.hasOwnProperty("__metadata__") === false) {
                return;
            }

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

                // Retrieve the "RouteMethodDecorator" object assigned by the @route decorator at .route
                const routeMethodDecorator: RouteMethodDecorator = method.route;

                // Build the Route object that will be used the the router to dispatch a request to
                // the appropriate controller method
                const route = new Route(controller.constructor, routeMethodDecorator.methodKeyname);
                route.methodArguments = method.arguments ?? [];

                // Setup the guards for this route
                const guards: any[] = controller.__metadata__?.controller?.guards ?? [];
                guards.push(...(method.guards ?? []));

                // Loop through the guards and check to see if they need to be instantiated or if they already are
                route.guards = guards.map(guard => {
                    // Check if the guard needs to be instantiated
                    let instantiatedGuard = guard;

                    if(typeof guard === 'function') {
                        instantiatedGuard = this.container.resolve(guard);
                    }

                    // Check again if the class as the isAuthorized method
                    if(typeof instantiatedGuard.isAuthorized !== 'function') {
                        throw new GuardInitializationError("The guard: '" + guard + "' doesn't implement the isAuthorized() method.");
                    }

                    return instantiatedGuard;
                })

                // Build the proper path
                let path = routeMethodDecorator.path;

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
                this.router.register(routePath, routeMethodDecorator.httpMethod, route);
            }
        })
    }
}