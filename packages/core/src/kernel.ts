import "reflect-metadata";
import {container, DependencyContainer} from "tsyringe";
import {
    AppModuleInterface,
    InternalContainerParameterEnum,
    ModuleInterface,
    moduleScopedServicesRegistry,
    ProviderRegistration, Request,
    ServiceDefinitionTagEnum,
    taggedProviderRegistrationsRegistry,
    TaggedRegistrationInterface
} from "@pristine-ts/common";
import {ConfigurationManager, ModuleConfigurationValue} from "@pristine-ts/configuration";
import {ProviderRegistrationError} from "./errors/provider-registration.error";
import {Span, SpanKeynameEnum, TracingManagerInterface} from "@pristine-ts/telemetry";
import {CoreModuleKeyname} from "./core.module.keyname";
import { v4 as uuidv4 } from 'uuid';
import {ExecutionContextInterface} from "./interfaces/execution-context.interface";
import {EventPipeline} from "./pipelines/event.pipeline";
import {Event} from "./models/event";
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
    private initializationSpan?: Span

    /**
     * Contains the unique instantiation identifier of this specific kernel instance.
     * @public
     */
    public instantiationId: string = uuidv4();

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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        initializedModuleSpans.forEach(span => this.initializationSpan!.addChild(span));

        // Register the configuration.
        const configurationInitializationSpan = new Span(SpanKeynameEnum.ConfigurationInitialization)
        await this.initConfiguration(moduleConfigurationValues);
        configurationInitializationSpan.endDate = Date.now();

        this.initializationSpan.addChild(configurationInitializationSpan);

        // Register the non module scoped tags
        await this.registerNonModuleScopedServiceTags();

        // Run the after init of the module and its dependencies
        await this.afterInitModule(module);

        this.initializationSpan.endDate = Date.now();

        const logHandler: LogHandlerInterface = this.container.resolve("LogHandlerInterface");

        logHandler.debug("Kernel: The Kernel was instantiated in '" + ((this.initializationSpan.endDate - this.initializationSpan.startDate) / 1000) + "' seconds.", {
            highlights: {
                initializationTime: ((this.initializationSpan.endDate - this.initializationSpan.startDate) / 1000),
            },
            extra: {
                initializationSpan: this.initializationSpan
            }
        }, CoreModuleKeyname);
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
            // @ts-ignore - Ignore this since even if we check for the property to exist, it complains.
            args.push(providerRegistration.options);
        }

        try {
            // @ts-ignore - Register the provider in the container
            this.container.register(...args);
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
            for (const importedModule of module.importModules) {
                spans.push(...(await this.initModule(importedModule)));
            }
        }

        importModulesSpan.endDate = Date.now();

        // Register the service tags for this module before other provider registration,
        // as inject only picks the latest one, and we want to be able to override tags with
        // regular provider registrations.
        await this.registerModuleServiceTags(module);

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
        for (const key in this.instantiatedModules) {
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
            for (const importedModule of module.importModules) {
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
     * This method loops through the service tag decorators defined in the taggedProviderRegistrationsRegistry and simply adds
     * the entries that are scoped to the module we are instantiating to the container.
     *
     * @param module Module being instantiated.
     * @private
     */
    private registerModuleServiceTags(module: ModuleInterface) {
        taggedProviderRegistrationsRegistry.forEach((taggedRegistrationType: TaggedRegistrationInterface) => {
            // Verify that if the constructor is moduleScoped, we only load it if its corresponding module is initialized.
            // We only register the service tags for the module that is currently being initialized.
            // If the module is not initialized, we do not load the tagged service.
            // This is to prevent that classes that are only imported get registered event if the module is not initialized.
            const moduleScopedRegistration = moduleScopedServicesRegistry[taggedRegistrationType.constructor];
            if (module.keyname !== moduleScopedRegistration?.moduleKeyname) {
                return;
            }

            this.registerProviderRegistration(taggedRegistrationType.providerRegistration);
        })
    }

    /**
     * This method loops through the service tag decorators defined in the taggedProviderRegistrationsRegistry and simply add
     * all the entry that are not module scoped to the container.
     * @private
     */
    private registerNonModuleScopedServiceTags() {
        taggedProviderRegistrationsRegistry.forEach((taggedRegistrationType: TaggedRegistrationInterface) => {
            const moduleScopedRegistration = moduleScopedServicesRegistry[taggedRegistrationType.constructor];
            if (moduleScopedRegistration) {
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
    public async handle<T>(event: any | Request | Event<any>, executionContext: ExecutionContextInterface<T>): Promise<object> {
        // Start the tracing
        const tracingManager: TracingManagerInterface = this.container.resolve("TracingManagerInterface");
        tracingManager.startTracing();

        if(this.initializationSpan) {
            tracingManager.trace?.rootSpan?.addChild(this.initializationSpan)
            tracingManager.addSpan(this.initializationSpan);

            // End the spans
            this.initializationSpan.end();

            // We set the initialization span to undefined since we will only add it to the Trace once
            this.initializationSpan = undefined;
        }

        // Retrieve the EventPipeline. It's the class responsible for executing all the events successfully.
        const eventPipeline = this.container.resolve(EventPipeline);

        const response = await eventPipeline.execute(event, executionContext, this.container);

        tracingManager.endTrace();

        return response;
    }

}
