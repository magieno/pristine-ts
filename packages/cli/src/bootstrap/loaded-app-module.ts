import {AppModuleInterface} from "@pristine-ts/common";
import {ModuleConfigurationValue} from "@pristine-ts/configuration";
import {LoadedPlugin} from "./loaded-plugin";

/**
 * The fully-resolved AppModule + ambient configuration that the CLI uses to boot the kernel.
 * Returned by `AppModuleLoader.load()`.
 */
export class LoadedAppModule {
  constructor(
    public readonly appModule: AppModuleInterface,
    public readonly configuration: { [key: string]: ModuleConfigurationValue },
    /**
     * True when `LoggingModule` is in the resolved AppModule's import graph. The CLI uses
     * this to decide whether to layer in opinionated default logging configuration (Simple
     * output mode, Error severity threshold) on top of the kernel configuration.
     */
    public readonly isLoggingModulePresent: boolean,
    /**
     * Plugins loaded from `pristine.config.ts`'s `plugins` array. Empty when no plugins are
     * declared. Carried through so commands like `pristine info` can show what's contributing
     * extra modules to the runtime.
     */
    public readonly plugins: LoadedPlugin[],
  ) {
  }
}
