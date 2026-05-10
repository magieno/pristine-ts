import "reflect-metadata";
import {container, DependencyContainer} from "tsyringe";
import {
  AppModuleInterface,
  InternalContainerParameterEnum,
  ModuleInterface,
  moduleScopedServicesRegistry,
  ProviderRegistration,
  Request,
  ServiceDefinitionTagEnum,
  taggedProviderRegistrationsRegistry,
  TaggedRegistrationInterface
} from "@pristine-ts/common";
import {ConfigurationManager, ModuleConfigurationValue} from "@pristine-ts/configuration";
import {ProviderRegistrationError} from "./errors/provider-registration.error";
import {Span, SpanKeynameEnum, TracingManagerInterface} from "@pristine-ts/telemetry";
import {v4 as uuidv4} from 'uuid';
import {ExecutionContextInterface} from "./interfaces/execution-context.interface";
import {EventPipeline} from "./pipelines/event.pipeline";
import {Event} from "./models/event";
import {KernelInitializationError} from "./errors/kernel-initialization.error";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {InstantiationTestInterface} from "./interfaces/instantiation-test.interface";
import {InstantiationReport} from "./models/instantiation-report";
import {PhaseResult} from "./models/phase-result";
import {SerializedError} from "./interfaces/serialized-error.interface";
import {InstantiationTestExecutionResult} from "./models/instantiation-test-execution-result";
import {MissingRequiredConfigurationEntry} from "./models/missing-required-configuration-entry";
import {InstantiationPhaseEnum} from "./enums/instantiation-phase.enum";
import {InstantiationStatusEnum} from "./enums/instantiation-status.enum";

/**
 * This is the central class that manages the lifecyle of this library.
 */
export class Kernel {
  /**
   * Contains a reference to the root Dependency Injection Container.
   */
  public container: DependencyContainer = container.createChildContainer();
  /**
   * Contains the unique instantiation identifier of this specific kernel instance.
   * @public
   */
  public instantiationId: string = uuidv4();
  /**
   * Contains a map of all the modules that were instantiated indexed by the modules names.
   * @public Exposed read-only so commands like `pristine info` can introspect the boot graph.
   */
  public instantiatedModules: { [id: string]: ModuleInterface } = {};
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
   * True after `stop()` has begun (or completed). Prevents double-shutdown when multiple
   * SIGTERM/SIGINT signals arrive in quick succession.
   * @private
   */
  private stopped: boolean = false;

  /**
   * This function is the entry point of the Kernel. It initializes the module for your application (AppModule) as well as its the dependencies,
   * it registers the services, registers the configurations and runs the afterInit for each module.
   * @param module
   * @param moduleConfigurationValues
   */
  public async start(module: AppModuleInterface, moduleConfigurationValues?: {
    [key: string]: ModuleConfigurationValue
  }) {
    this.initializationSpan = new Span(SpanKeynameEnum.KernelInitialization);
    // Register the InstantiationId in the container.
    this.container.register(InternalContainerParameterEnum.KernelInstantiationId, {
      useValue: this.instantiationId,
    });

    // Inits the application module and its dependencies.
    const initializedModuleSpans = await this.initModule(module);

    if (this.initializationSpan === undefined) {
      throw new KernelInitializationError("The InitializationSpan is undefined and shouldn't be.")
    }

    // Add every spans as a child of the Initialization Span
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    initializedModuleSpans.forEach(span => this.initializationSpan!.addChild(span));

    // Register the configuration.
    const configurationInitializationSpan = new Span(SpanKeynameEnum.ConfigurationInitialization)
    const configurationManager = this.registerConfigurationDefinitions();
    await this.loadConfiguration(configurationManager, moduleConfigurationValues);
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
    });
  }

  /**
   * Verifies that this kernel can be fully instantiated against the provided AppModule and configuration values.
   * Runs the same boot phases as `start()` on this kernel, capturing each phase's outcome rather than letting
   * exceptions propagate, then collects and runs every embedder-registered `InstantiationTestInterface`.
   *
   * Important: this method mutates the kernel's container (it actually performs registration). It should be
   * called on a fresh `new Kernel()` instance, not on a kernel that has already had `start()` invoked.
   *
   * @param module The AppModule to verify.
   * @param moduleConfigurationValues The configuration values that would be passed to `start()`.
   * @param options.runInstantiationTests When false, skips the test discovery/execution phase. Default true.
   * @param options.stopOnFirstFailure When true, halts after the first failed phase and marks the rest as skipped. Default false.
   */
  public async verifyInstantiation(module: AppModuleInterface, moduleConfigurationValues?: {
    [key: string]: ModuleConfigurationValue
  }, options?: { runInstantiationTests?: boolean; stopOnFirstFailure?: boolean }): Promise<InstantiationReport> {
    const report = new InstantiationReport();
    const startedAt = Date.now();

    const runInstantiationTests = options?.runInstantiationTests !== false;
    const stopOnFirstFailure = options?.stopOnFirstFailure === true;

    // Phase 1: ModuleRegistration. Must succeed for any subsequent phase to be meaningful — if it fails,
    // the container is in an indeterminate state and we skip everything else.
    const moduleRegistrationOk = await this.runPhase(report, InstantiationPhaseEnum.ModuleRegistration, async () => {
      this.container.register(InternalContainerParameterEnum.KernelInstantiationId, {
        useValue: this.instantiationId,
      });
      await this.initModule(module);
    });

    if (!moduleRegistrationOk) {
      this.skipRemainingPhases(report, [
        InstantiationPhaseEnum.ConfigurationCheck,
        InstantiationPhaseEnum.ConfigurationLoad,
        InstantiationPhaseEnum.ServiceTagRegistration,
        InstantiationPhaseEnum.AfterInit,
        InstantiationPhaseEnum.BootProbe,
        InstantiationPhaseEnum.InstantiationTests,
      ]);
      report.totalDurationMs = Date.now() - startedAt;
      return report;
    }

    // Phase 2: ConfigurationCheck. Register all module configuration definitions, then non-mutatively
    // inspect for missing required values. This phase is informational only — it surfaces what is missing
    // but cannot itself determine whether `start()` would throw, because a defaultResolver might or might
    // not succeed at load time (resolver failures are silently swallowed by ConfigurationManager.load).
    // ConfigurationLoad is the source of truth for "would start throw."
    let configurationManager: ConfigurationManager | undefined;
    const configurationCheckOk = await this.runPhase(report, InstantiationPhaseEnum.ConfigurationCheck, async () => {
      configurationManager = this.registerConfigurationDefinitions();
      const missing = configurationManager.getMissingRequiredParameters(moduleConfigurationValues ?? {});
      report.missingRequiredConfiguration = missing.map(m => new MissingRequiredConfigurationEntry(m.parameterName, m.hasDefaultResolvers));
    });
    if (configurationCheckOk && report.missingRequiredConfiguration.length > 0) {
      const lastPhase = report.phases[report.phases.length - 1];
      lastPhase.status = InstantiationStatusEnum.PassedWithWarnings;
    }

    if (!configurationCheckOk && stopOnFirstFailure) {
      this.skipRemainingPhases(report, [
        InstantiationPhaseEnum.ConfigurationLoad,
        InstantiationPhaseEnum.ServiceTagRegistration,
        InstantiationPhaseEnum.AfterInit,
        InstantiationPhaseEnum.BootProbe,
        InstantiationPhaseEnum.InstantiationTests,
      ]);
      report.totalDurationMs = Date.now() - startedAt;
      return report;
    }

    // ConfigurationCheck registers definitions but doesn't load. If that registration itself failed,
    // there's no manager to load from — skip ConfigurationLoad.
    let configurationLoadOk: boolean;
    if (configurationManager === undefined) {
      this.skipPhase(report, InstantiationPhaseEnum.ConfigurationLoad);
      configurationLoadOk = false;
    } else {
      configurationLoadOk = await this.runPhase(report, InstantiationPhaseEnum.ConfigurationLoad, async () => {
        await this.loadConfiguration(configurationManager!, moduleConfigurationValues);
      });
    }

    if (!configurationLoadOk && stopOnFirstFailure) {
      this.skipRemainingPhases(report, [
        InstantiationPhaseEnum.ServiceTagRegistration,
        InstantiationPhaseEnum.AfterInit,
        InstantiationPhaseEnum.BootProbe,
        InstantiationPhaseEnum.InstantiationTests,
      ]);
      report.totalDurationMs = Date.now() - startedAt;
      return report;
    }

    const serviceTagOk = await this.runPhase(report, InstantiationPhaseEnum.ServiceTagRegistration, async () => {
      this.registerNonModuleScopedServiceTags();
    });

    if (!serviceTagOk && stopOnFirstFailure) {
      this.skipRemainingPhases(report, [
        InstantiationPhaseEnum.AfterInit,
        InstantiationPhaseEnum.BootProbe,
        InstantiationPhaseEnum.InstantiationTests,
      ]);
      report.totalDurationMs = Date.now() - startedAt;
      return report;
    }

    const afterInitOk = await this.runPhase(report, InstantiationPhaseEnum.AfterInit, async () => {
      await this.afterInitModule(module);
    });

    if (!afterInitOk && stopOnFirstFailure) {
      this.skipRemainingPhases(report, [InstantiationPhaseEnum.BootProbe, InstantiationPhaseEnum.InstantiationTests]);
      report.totalDurationMs = Date.now() - startedAt;
      return report;
    }

    const bootProbeOk = await this.runPhase(report, InstantiationPhaseEnum.BootProbe, async () => {
      // Mirror the cosmetic LogHandler resolve at the end of `start()`. If LoggingModule wasn't imported,
      // the resolve will throw and the phase is marked Failed.
      this.container.resolve<LogHandlerInterface>("LogHandlerInterface");
    });

    // Once BootProbe has confirmed LogHandler is resolvable, stamp it onto the report so `report.log()`
    // can route through the project's logging stack without callers having to pass one in.
    if (bootProbeOk) {
      try {
        report.logHandler = this.container.resolve<LogHandlerInterface>("LogHandlerInterface");
      } catch {
        // Should not happen since BootProbe already succeeded, but defensive.
      }
    }

    if (runInstantiationTests) {
      await this.runPhase(report, InstantiationPhaseEnum.InstantiationTests, async () => {
        let tests: InstantiationTestInterface[] = [];
        try {
          tests = this.container.resolveAll<InstantiationTestInterface>(ServiceDefinitionTagEnum.InstantiationTest);
        } catch {
          // resolveAll throws when nothing is registered for the token. That's not a failure — there are simply no tests.
          tests = [];
        }

        for (const test of tests) {
          report.instantiationTests.push(await this.runInstantiationTest(test));
        }
      });
    } else {
      this.skipPhase(report, InstantiationPhaseEnum.InstantiationTests);
    }

    report.totalDurationMs = Date.now() - startedAt;
    return report;
  }

  /**
   * Gracefully shuts down the kernel by invoking each instantiated module's `onShutdown` hook
   * in reverse instantiation order (root module first, deepest dependencies last). Modules
   * without an `onShutdown` hook are skipped silently.
   *
   * Each hook runs under a per-hook timeout so a single misbehaving module cannot block the
   * shutdown indefinitely. When a hook throws or times out, the error is logged via the
   * resolved `LogHandlerInterface` (or stderr if logging itself failed) and shutdown continues
   * with the next module — the goal is to release as much as possible, not to abort on the
   * first failure.
   *
   * Calling `stop()` more than once is a no-op (subsequent calls return immediately) so this
   * method is safe to wire up to multiple signal handlers.
   *
   * @param options.perHookTimeoutMs Maximum milliseconds to wait for a single module's
   *        `onShutdown` to resolve. Default 10_000 (10 seconds). Set to 0 to wait indefinitely.
   */
  public async stop(options?: {perHookTimeoutMs?: number}): Promise<void> {
    if (this.stopped) {
      return;
    }
    this.stopped = true;

    const perHookTimeoutMs = options?.perHookTimeoutMs ?? 10_000;

    let logHandler: LogHandlerInterface | undefined;
    try {
      logHandler = this.container.resolve<LogHandlerInterface>("LogHandlerInterface");
    } catch {
      // Logging may not have booted (e.g. start() failed mid-flight). Fall back to stderr.
    }

    // Insertion order: `initModule` records the parent BEFORE recursing into children, so the
    // map's natural key order is root → branch → leaf. Shutting down in that order means the
    // outer-most modules (AppModule and its direct imports) tear down first while their
    // dependencies (logging, configuration, the container itself) are still healthy — exactly
    // what we want.
    const moduleNames = Object.keys(this.instantiatedModules);

    for (const name of moduleNames) {
      const module = this.instantiatedModules[name];
      if (typeof module.onShutdown !== "function") {
        continue;
      }

      try {
        await this.runWithTimeout(module.onShutdown(this.container), perHookTimeoutMs, name);
      } catch (error) {
        const message = `[Kernel] onShutdown failed for module '${name}': ${(error as Error).message}`;
        if (logHandler !== undefined) {
          logHandler.error(message, {extra: {moduleKeyname: name, error}});
        } else {
          process.stderr.write(message + "\n");
        }
      }
    }

    if (logHandler !== undefined && typeof logHandler.terminate === "function") {
      try {
        logHandler.terminate();
      } catch {
        // Best-effort.
      }
    }
  }

  /**
   * Wraps a Promise in a timeout that rejects with a clear error if not settled in time.
   * `timeoutMs <= 0` disables the timeout entirely.
   * @private
   */
  private async runWithTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    if (timeoutMs <= 0) {
      return promise;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`onShutdown for '${label}' exceeded ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
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

    if (this.initializationSpan) {
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
   * Resolves the ConfigurationManager and registers every module's configuration definitions onto it.
   * Returns the manager so the caller can subsequently inspect required parameters or call `load()`.
   * Split out from the original `initConfiguration` so `verifyInstantiation` can run a non-mutating
   * check between definition registration and value loading.
   * @private
   */
  private registerConfigurationDefinitions(): ConfigurationManager {
    const configurationManager: ConfigurationManager = this.container.resolve(ConfigurationManager);

    for (const key in this.instantiatedModules) {
      if (this.instantiatedModules.hasOwnProperty(key) === false) {
        continue;
      }

      const instantiatedModule: ModuleInterface = this.instantiatedModules[key];
      if (instantiatedModule.configurationDefinitions) {
        instantiatedModule.configurationDefinitions.forEach(configurationDefinition => configurationManager.register(configurationDefinition));
      }
    }

    return configurationManager;
  }

  /**
   * Loads the configuration values into the previously-registered ConfigurationManager.
   * @private
   */
  private async loadConfiguration(configurationManager: ConfigurationManager, moduleConfigurationValues?: { [key: string]: ModuleConfigurationValue }) {
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
   * Wraps a phase invocation: times it, captures any thrown error into a serialized form, appends a
   * PhaseResult to the report, and returns whether the phase passed.
   * @private
   */
  private async runPhase(report: InstantiationReport, phase: InstantiationPhaseEnum, fn: () => Promise<void>): Promise<boolean> {
    const startedAt = Date.now();
    try {
      await fn();
      report.phases.push(new PhaseResult(phase, InstantiationStatusEnum.Passed, Date.now() - startedAt));
      return true;
    } catch (error) {
      report.phases.push(new PhaseResult(phase, InstantiationStatusEnum.Failed, Date.now() - startedAt, this.serializeError(error)));
      return false;
    }
  }

  private async runInstantiationTest(test: InstantiationTestInterface): Promise<InstantiationTestExecutionResult> {
    const startedAt = Date.now();
    try {
      const result = await test.run(this.container);
      return new InstantiationTestExecutionResult(test.name, result.passed, Date.now() - startedAt, test.description, result.message, result.details);
    } catch (error) {
      return new InstantiationTestExecutionResult(test.name, false, Date.now() - startedAt, test.description, undefined, undefined, this.serializeError(error));
    }
  }

  private skipPhase(report: InstantiationReport, phase: InstantiationPhaseEnum) {
    report.phases.push(new PhaseResult(phase, InstantiationStatusEnum.Skipped, 0));
  }

  private skipRemainingPhases(report: InstantiationReport, phases: InstantiationPhaseEnum[]) {
    for (const phase of phases) {
      this.skipPhase(report, phase);
    }
  }

  private serializeError(error: unknown): SerializedError {
    if (error instanceof Error) {
      return {name: error.name, message: error.message, stack: error.stack};
    }
    return {name: "UnknownError", message: String(error)};
  }

}
