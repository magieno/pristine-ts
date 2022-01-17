import "reflect-metadata";
import {container, DependencyContainer} from "tsyringe";
import {
    AppModuleInterface,
    InternalContainerParameterEnum,
    ModuleInterface,
    moduleScopedServicesRegistry,
    ProviderRegistration,
    ServiceDefinitionTagEnum,
    taggedProviderRegistrationsRegistry,
    TaggedRegistrationInterface
} from "@pristine-ts/common";
import {ConfigurationManager, ModuleConfigurationValue} from "@pristine-ts/configuration";
import {ProviderRegistrationError} from "./errors/provider-registration.error";
import {Span, SpanKeynameEnum, TracingManagerInterface} from "@pristine-ts/telemetry";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CoreModuleKeyname} from "./core.module.keyname";
import { v4 as uuidv4 } from 'uuid';
import {ExecutionContextInterface} from "./interfaces/execution-context.interface";
import {EventPipeline} from "./pipelines/event.pipeline";

/**
 * This is the central class that manages the lifecyle of this library.
 */
export class Kernel {
    /**
     * Contains a reference to the root Dependency Injection Container.
     */
    public container: DependencyContainer = container.createChildContainer();

    /**
     * Contains a map of all the modules that were instantiated indexed by the modules names.
     * @private
     */
    private instantiatedModules: { [id: string]: ModuleInterface } = {};

    /**
     * Contains a map of all the modules that the afterInit was run for, indexed by the modules names .
     * @private
     */
    private afterInstantiatedModules: { [id: string]: ModuleInterface } = {};

    // /**
    //  * Contains a reference to the Router. It is undefined until this.setupRouter() is called.
    //  * @private
    //  */
    // private router?: RouterInterface;

    /**
     * Contains the span for the initialization.
     * @private
     */
    private initializationSpan!: Span

    /**
     * Contains the unique instantiation identifier of this specific kernel instance.
     * @public
     */
    public instantiationId: string = uuidv4();

    public constructor() {
    }

    /**
     * This function is the entry point of the library. It initializes the module for your application (AppModule) as well as its the dependencies,
     * it registers the services, registers the configurations and runs the afterInit for each module.
     * @param module
     * @param moduleConfigurationValues
     * @deprecated To be deprecated soon. You should use the start method now, the init method will be made private soon.
     */
    public async init(module: ModuleInterface, moduleConfigurationValues?: { [key: string]: ModuleConfigurationValue }) {
        this.initializationSpan = new Span(SpanKeynameEnum.KernelInitialization);
        // Register the InstantiationId in the container.
        this.container.register(InternalContainerParameterEnum.KernelInstantiationId, {
            useValue: this.instantiationId,
        });

        // Inits the application module and its dependencies.
        const initializedModuleSpans = await this.initModule(module);

        // Add every spans as a child of the Initialization Span
        initializedModuleSpans.forEach(span => this.initializationSpan.addChild(span));

        // Register all the service tags in the container.
        await this.registerServiceTags();

        // Register the configuration.
        const configurationInitializationSpan = new Span(SpanKeynameEnum.ConfigurationInitialization)
        await this.initConfiguration(moduleConfigurationValues);
        configurationInitializationSpan.endDate = Date.now();

        this.initializationSpan.addChild(configurationInitializationSpan);

        // Run the after init of the module and its dependencies
        await this.afterInitModule(module);

        this.initializationSpan.endDate = Date.now();

        const logHandler: LogHandlerInterface = this.container.resolve("LogHandlerInterface");

        logHandler.debug("The Kernel was instantiated in '" + ((this.initializationSpan.endDate - this.initializationSpan.startDate) / 1000) + "' seconds", {initializationSpan: this.initializationSpan}, CoreModuleKeyname);
    }

    /**
     * Registers the provider registration in the container.
     * @param providerRegistration
     * @private
     */
    private registerProviderRegistration(providerRegistration: ProviderRegistration) {
        const args = [
            providerRegistration.token,
            providerRegistration,
        ];

        if (providerRegistration.hasOwnProperty("options")) {
            // Ignore this since even if we check for the property to exist, it complains.
            // @ts-ignore
            args.push(providerRegistration.options);
        }

        try {
            // Register the provider in the container
            // @ts-ignore
            this.container.register.apply(this.container, args);
        } catch (e) {
            throw new ProviderRegistrationError("There was an error registering the providerRegistration: ", providerRegistration, this);
        }
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
    private async initModule(module: ModuleInterface): Promise<Span[]> {
        // If this module is already instantiated, simply return undefined as there's no span to return;
        if (this.instantiatedModules.hasOwnProperty(module.keyname)) {
            return [];
        }

        // Add the module to the instantiatedModules map.
        this.instantiatedModules[module.keyname] = module;

        const spans: Span[] = [];

        // Created the span that will be used to track how long the instantiation takes.
        const span: Span = new Span(SpanKeynameEnum.ModuleInitialization + "." + module.keyname);

        const importModulesSpan: Span = new Span(SpanKeynameEnum.ModuleInitializationImportModules + "." + module.keyname);

        span.addChild(importModulesSpan)

        if (module.importModules) {
            // Start by recursively importing all the packages
            for (let importedModule of module.importModules) {
                spans.push(...(await this.initModule(importedModule)));
            }
        }

        importModulesSpan.endDate = Date.now();

        // Add all the providers to the container
        if (module.providerRegistrations) {
            module.providerRegistrations.forEach((providerRegistration: ProviderRegistration) => {
                this.registerProviderRegistration(providerRegistration);
            })
        }

        // Run the onInit function for the module.
        if (module.onInit) {
            await module.onInit(this.container);
        }

        // End the initialization span by setting the date. Since we don't have the tracing manager yet,
        // They will all be ended properly but they will keep the current time.
        span.endDate = Date.now();

        spans.push(span);

        return spans;
    }

    /**
     * Registers all the configuration definitions that all the modules have defined.
     * @param moduleConfigurationValues
     * @private
     */
    private async initConfiguration(moduleConfigurationValues?: { [key: string]: ModuleConfigurationValue }) {
        const configurationManager: ConfigurationManager = this.container.resolve(ConfigurationManager);

        // Start by loading the configuration definitions of all the modules
        for (let key in this.instantiatedModules) {
            if (this.instantiatedModules.hasOwnProperty(key) === false) {
                continue;
            }

            const instantiatedModule: ModuleInterface = this.instantiatedModules[key];
            if (instantiatedModule.configurationDefinitions) {
                instantiatedModule.configurationDefinitions.forEach(configurationDefinition => configurationManager.register(configurationDefinition));
            }
        }

        // Load the configuration values passed by the app
        await configurationManager.load(moduleConfigurationValues ?? {}, this.container);
    }

    /**
     * This method receives a module and recursively calls back this method with the module dependencies
     * specified as imported by the module.
     *
     * @param module
     * @private
     */
    private async afterInitModule(module: ModuleInterface) {
        if (module.importModules) {
            // Start by recursively importing all the packages
            for (let importedModule of module.importModules) {
                await this.afterInitModule(importedModule);
            }
        }

        if (this.afterInstantiatedModules.hasOwnProperty(module.keyname)) {
            // module already instantiated, we return
            return;
        }

        if (module.afterInit) {
            await module.afterInit(this.container);
        }

        this.afterInstantiatedModules[module.keyname] = module;
    }

    // /**
    //  * This method executes all the RequestInterceptors and returns the request updated by the interceptors.
    //  *
    //  * @param request
    //  * @param container
    //  * @private
    //  */
    // private async executeRequestInterceptors(request: Request, container: DependencyContainer): Promise<Request> {
    //     // Execute all the request interceptors
    //     let interceptedRequest = request;
    //
    //     // Check first if there are any RequestInterceptors
    //     if (container.isRegistered(ServiceDefinitionTagEnum.RequestInterceptor, true)) {
    //         const interceptors: any[] = container.resolveAll(ServiceDefinitionTagEnum.RequestInterceptor);
    //
    //         for (const interceptor of interceptors) {
    //             // We don't have a guarantee that the request interceptors will implement the Interface, even though we specify it should.
    //             // So, we have to verify that the method exists, and if it doesn't we throw
    //             if (typeof interceptor.interceptRequest === "undefined") {
    //                 throw new RequestInterceptionExecutionError("The Request Interceptor doesn't have the 'interceptRequest' method. RequestInterceptors should implement the RequestInterceptor interface.", request, this);
    //             }
    //
    //             interceptedRequest = await Promise.resolve((interceptor as RequestInterceptorInterface).interceptRequest(interceptedRequest));
    //         }
    //     }
    //
    //     return interceptedRequest;
    // }
    //
    // /**
    //  * This method executes all the response interceptors and returns the response updated by the interceptors.
    //  *
    //  * @param response
    //  * @param request
    //  * @param container
    //  * @private
    //  */
    // private async executeResponseInterceptors(response: Response, request: Request, container: DependencyContainer): Promise<Response> {
    //     // Execute all the request interceptors
    //     let interceptedResponse = response;
    //
    //     // Check first if there are any RequestInterceptors
    //     if (container.isRegistered(ServiceDefinitionTagEnum.ResponseInterceptor, true)) {
    //         const interceptors: any[] = container.resolveAll(ServiceDefinitionTagEnum.ResponseInterceptor);
    //
    //         for (const interceptor of interceptors) {
    //             // We don't have a guarantee that the request interceptors will implement the Interface, even though we specify it should.
    //             // So, we have to verify that the method exists, and if it doesn't we throw
    //             if (typeof interceptor.interceptResponse === "undefined") {
    //                 throw new ResponseInterceptionExecutionError("The Response Interceptor doesn't have the 'interceptResponse' method. ResponseInterceptors should implement the ResponseInterceptor interface.", request, response, interceptor)
    //             }
    //
    //             interceptedResponse = await Promise.resolve((interceptor as ResponseInterceptorInterface).interceptResponse(interceptedResponse, request));
    //         }
    //     }
    //
    //     return interceptedResponse;
    // }
    //
    // /**
    //  * This method executes all the error response interceptors and returns the response updated by the interceptors.
    //  *
    //  * @param error
    //  * @param request
    //  * @param container
    //  * @private
    //  */
    // private async executeErrorResponseInterceptors(error: Error, request: Request, container: DependencyContainer): Promise<Response> {
    //     // Execute all the request interceptors
    //     let interceptedErrorResponse = new Response();
    //     interceptedErrorResponse.request = request;
    //
    //     interceptedErrorResponse.body = {
    //         name: error.name,
    //         message: error.message,
    //     };
    //
    //     if (error instanceof HttpError) {
    //         const httpError: HttpError = error as HttpError;
    //
    //         interceptedErrorResponse.status = httpError.httpStatus
    //
    //         if (httpError.errors) {
    //             interceptedErrorResponse.body.errors = httpError.errors
    //         }
    //     } else {
    //         interceptedErrorResponse.status = 500;
    //     }
    //
    //     // Check first if there are any RequestInterceptors
    //     if (container.isRegistered(ServiceDefinitionTagEnum.ErrorResponseInterceptor, true)) {
    //         const interceptors: any[] = container.resolveAll(ServiceDefinitionTagEnum.ErrorResponseInterceptor);
    //
    //         for (const interceptor of interceptors) {
    //             // We don't have a guarantee that the request interceptors will implement the Interface, even though we specify it should.
    //             // So, we have to verify that the method exists, and if it doesn't we throw
    //             if (typeof interceptor.interceptError === "undefined") {
    //                 throw new ErrorResponseInterceptionExecutionError("The Error Response Interceptor doesn't have the 'interceptError' method. ErrorResponseInterceptors should implement the ErrorResponseInterceptor interface.", error, request, interceptor)
    //             }
    //
    //             try {
    //                 // https://stackoverflow.com/a/27760489/684101
    //                 interceptedErrorResponse = await Promise.resolve((interceptor as ErrorResponseInterceptorInterface).interceptError(error, request, interceptedErrorResponse));
    //             } catch (e) {
    //                 throw new ErrorResponseInterceptionExecutionError("There was an exception thrown while executing the 'interceptError' method of the ErrorResponseInterceptors", error, request, interceptor, e)
    //             }
    //         }
    //     }
    //
    //     return interceptedErrorResponse;
    // }

    public async start(module: AppModuleInterface, moduleConfigurationValues?: { [key: string]: ModuleConfigurationValue }) {
        return this.init(module, moduleConfigurationValues);
    }

    public async handle<T>(event: object, executionContext: ExecutionContextInterface<T>): Promise<object> {
        // Retrieve the EventPipeline. It's the class responsible for executing all the events successfully.
        const eventPipeline = this.container.resolve(EventPipeline);

        return eventPipeline.execute(event, executionContext, this.container);
    }

    // /**
    //  * This method receives a requestInterface, calls the router to execute the request and returns the response. This method
    //  * calls all the interceptors. This should be the only point with the outside world when dealing with requests.
    //  *
    //  * @param requestInterface
    //  */
    // public async handleRequest(requestInterface: RequestInterface): Promise<Response> {
    //     const routerSetupSpan = new Span(SpanKeynameEnum.RouterSetup);
    //
    //     // Setup the router
    //     this.setupRouter();
    //
    //     routerSetupSpan.endDate = Date.now();
    //     this.initializationSpan.addChild(routerSetupSpan);
    //
    //     const request = new Request(requestInterface);
    //
    //     return new Promise(async (resolve) => {
    //         // Check for the router to not be undefined.
    //         if (this.router === undefined) {
    //             throw new RequestHandlingError("The Router is undefined", request, this);
    //         }
    //
    //         // Start by creating a child container and we will use this container to instantiate the dependencies for this request
    //         const childContainerCreationSpan = new Span(SpanKeynameEnum.ChildContainerCreation);
    //         const childContainer = this.container.createChildContainer();
    //         childContainerCreationSpan.endDate = Date.now();
    //         this.initializationSpan.addChild(childContainerCreationSpan);
    //
    //         // Start the tracing
    //         const tracingManager: TracingManagerInterface = childContainer.resolve("TracingManagerInterface");
    //         tracingManager.startTracing();
    //         tracingManager.trace?.rootSpan?.addChild(this.initializationSpan)
    //         tracingManager.addSpan(this.initializationSpan);
    //
    //         // End the spans
    //         this.initializationSpan.end();
    //         routerSetupSpan.end();
    //
    //         const requestSpan = tracingManager.startSpan(SpanKeynameEnum.RequestExecution);
    //
    //         try {
    //             // Execute all the request interceptors
    //             const requestInterceptorsSpan = tracingManager.startSpan(SpanKeynameEnum.RequestInterceptors, requestSpan.keyname);
    //             const interceptedRequest = await this.executeRequestInterceptors(request, childContainer);
    //             requestInterceptorsSpan.end();
    //
    //             // Execute the actual request.
    //             const response = await this.router.execute(interceptedRequest, childContainer);
    //
    //             // Execute all the response interceptors
    //             const responseInterceptorsSpan = tracingManager.startSpan(SpanKeynameEnum.ResponseInterceptors, requestSpan.keyname);
    //             const interceptedResponse = await this.executeResponseInterceptors(response, request, childContainer);
    //             responseInterceptorsSpan.end();
    //
    //             // End the tracing
    //             requestSpan.end();
    //             tracingManager.endTrace();
    //
    //             return resolve(interceptedResponse);
    //         } catch (error) {
    //             // Transform the error into a response object
    //             const errorResponseInterceptorsSpan = tracingManager.startSpan(SpanKeynameEnum.ErrorResponseInterceptors, requestSpan.keyname);
    //             const errorResponse = await this.executeErrorResponseInterceptors(error, request, childContainer);
    //             errorResponseInterceptorsSpan.end();
    //
    //             // Execute all the response interceptors
    //             const responseInterceptorsSpan = tracingManager.startSpan(SpanKeynameEnum.ResponseInterceptors, requestSpan.keyname);
    //             const interceptedResponse = await this.executeResponseInterceptors(errorResponse, request, childContainer);
    //             responseInterceptorsSpan.end();
    //
    //             // End the tracing
    //             requestSpan.end();
    //             tracingManager.endTrace();
    //
    //             return resolve(interceptedResponse);
    //         }
    //     })
    // }

    // /**
    //  * This method loops through the all the classes decorated with @controller, loops through all the methods decorated
    //  * with @route and builds the dependency tree of all the routes.
    //  *
    //  * @private
    //  */
    // private setupRouter() {
    //     if (this.router) {
    //         return;
    //     }
    //     this.router = this.container.resolve(Router);
    //
    //     // Init the controllers
    //     controllerRegistry.forEach(controller => {
    //         if (this.router === undefined) {
    //             throw new KernelInitializationError("The Router is undefined");
    //         }
    //
    //         if (controller.hasOwnProperty("__metadata__") === false) {
    //             return;
    //         }
    //
    //         let basePath: string = controller.__metadata__?.controller?.basePath;
    //
    //         // Clean the base path by removing trailing slashes.
    //         if (basePath.endsWith("/")) {
    //             basePath = basePath.slice(0, basePath.length - 1);
    //         }
    //
    //         for (const methodPropertyKey in controller.__metadata__?.methods) {
    //             if (controller.__metadata__?.methods?.hasOwnProperty(methodPropertyKey) === false) {
    //                 continue;
    //             }
    //
    //             const method = controller.__metadata__?.methods[methodPropertyKey];
    //
    //             if (method.hasOwnProperty("route") === false) {
    //                 continue;
    //             }
    //
    //             // Retrieve the "RouteMethodDecorator" object assigned by the @route decorator at .route
    //             const routeMethodDecorator: RouteMethodDecorator = method.route;
    //
    //             // Build the Route object that will be used the the router to dispatch a request to
    //             // the appropriate controller method
    //             const route = new Route(controller.constructor, routeMethodDecorator.methodKeyname);
    //             route.methodArguments = method.arguments ?? [];
    //             route.context = mergeWith({}, controller.__metadata__?.controller?.__routeContext__, method.__routeContext__);
    //
    //             // Build the proper path
    //             let path = routeMethodDecorator.path;
    //
    //             // Clean the path by removing the first and trailing slashes.
    //             if (path.startsWith("/")) {
    //                 path = path.slice(1, path.length);
    //             }
    //
    //             if (path.endsWith("/")) {
    //                 path = path.slice(0, path.length - 1);
    //             }
    //
    //             // Build the proper path
    //             const routePath = basePath + "/" + path;
    //
    //             // Register the route
    //             this.router.register(routePath, routeMethodDecorator.httpMethod, route);
    //         }
    //     })
    // }

    /**
     * This method loops through the service tag decorators defined in the taggedProviderRegistrationsRegistry and simply add
     * all the entry to the container.
     * @private
     */
    private registerServiceTags() {
        taggedProviderRegistrationsRegistry.forEach((taggedRegistrationType: TaggedRegistrationInterface) => {
            // Verify that if the constructor is moduleScoped, we only load it if its corresponding module is initialized.
            // If the module is not initialized, we do not load the tagged service.
            // This is to prevent that classes that are only imported get registered event if the module is not initialized.
            const moduleScopedRegistration = moduleScopedServicesRegistry[taggedRegistrationType.constructor];
            if (moduleScopedRegistration && this.instantiatedModules.hasOwnProperty(moduleScopedRegistration.moduleKeyname) === false) {
                return;
            }

            this.registerProviderRegistration(taggedRegistrationType.providerRegistration);
        })
    }
}
