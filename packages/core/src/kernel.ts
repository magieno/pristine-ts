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
import {KernelInitializationError} from "./errors/kernel-initialization.error";

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
     * This function is the entry point of the Kernel. It initializes the module for your application (AppModule) as well as its the dependencies,
     * it registers the services, registers the configurations and runs the afterInit for each module.
     * @param module
     * @param moduleConfigurationValues
     */
    public async start(module: AppModuleInterface, moduleConfigurationValues?: { [key: string]: ModuleConfigurationValue }) {
        this.initializationSpan = new Span(SpanKeynameEnum.KernelInitialization);
        // Register the InstantiationId in the container.
        this.container.register(InternalContainerParameterEnum.KernelInstantiationId, {
            useValue: this.instantiationId,
        });

        // Inits the application module and its dependencies.
        const initializedModuleSpans = await this.initModule(module);

        if(this.initializationSpan === undefined) {
            throw new KernelInitializationError("The InitializationSpan is undefined and shouldn't be.")
        }

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

    /**
     *
     * @param event
     * @param executionContext
     */
    public async handle<T>(event: object, executionContext: ExecutionContextInterface<T>): Promise<object> {
        // todo: Put the code here to start the tracing.
        // previous code:
        //         // Start the tracing
        //         const tracingManager: TracingManagerInterface = childContainer.resolve("TracingManagerInterface");
        //         tracingManager.startTracing();
        //         tracingManager.trace?.rootSpan?.addChild(this.initializationSpan)
        //         tracingManager.addSpan(this.initializationSpan);
        //
        //         // End the spans
        //         this.initializationSpan.end();
        //         routerSetupSpan.end();

        // Retrieve the EventPipeline. It's the class responsible for executing all the events successfully.
        const eventPipeline = this.container.resolve(EventPipeline);

        return eventPipeline.execute(event, executionContext, this.container);
    }

}
