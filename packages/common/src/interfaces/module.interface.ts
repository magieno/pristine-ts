import {ProviderRegistration} from "../types/provider-registration.type";
import {DependencyContainer} from "tsyringe";
import {ConfigurationDefinition} from "../types/configuration-definition.type";

/**
 * The ModuleInterface is the entry point that groups all the classes that you want to handle in your module.
 * We decompose the code in Modules and the packages are initialized in the Kernel.
 */
export interface ModuleInterface {
  /**
   * This is a unique keyname that uniquely identifies the module.
   */
  keyname: string;

  /**
   * The packages to import before to initialize this module. This module might need other packages to be initialized
   * before being able to initialize itself.
   */
  importModules?: ModuleInterface[];

  /**
   * This property allows you to custom register specific services. For example, you can assign a tag or use a factory
   * to instantiate a specific class.
   */
  providerRegistrations?: ProviderRegistration[];

  /**
   * This property defines the configuration definition that allows the kernel to know if the provided configuration is sufficient
   * for the module.
   */
  configurationDefinitions?: ConfigurationDefinition[];

  /**
   * This function lets you run code on the module initialization. Be careful the tags and the router are not created yet.
   * @param container
   */
  onInit?(container: DependencyContainer): Promise<void>;

  /**
   * This function lets you run code on the module initialization after the tags and the router are created.
   * @param container
   */
  afterInit?(container: DependencyContainer): Promise<void>;

  /**
   * Optional graceful-shutdown hook. Invoked by `Kernel.stop()` when the runtime is shutting down
   * (typically in response to SIGTERM or SIGINT under `pristine start`). Modules should release
   * external resources here — close DB connections, drain queue consumers, stop background timers,
   * flush log buffers — before the process exits.
   *
   * Hooks are called in **outer-to-inner** order (root AppModule first, deepest dependencies
   * last) so that high-level modules can still call into their dependencies while they tear
   * themselves down. Each hook runs under a configurable per-hook timeout (default 10 seconds)
   * — exceeding it logs a warning and continues to the next module rather than blocking
   * shutdown indefinitely.
   *
   * Implementations must be idempotent: a kernel may receive multiple shutdown signals while
   * stop() is in flight, but stop() will only invoke each hook at most once.
   */
  onShutdown?(container: DependencyContainer): Promise<void>;
}
