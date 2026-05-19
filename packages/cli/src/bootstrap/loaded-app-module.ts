import {AppModuleInterface} from "@pristine-ts/common";
import {LoadedPlugin} from "./loaded-plugin";

/**
 * The fully-resolved AppModule and the plugin list that the CLI uses to boot the kernel.
 * Returned by `AppModuleLoader.load()`.
 *
 * **No `configuration` field.** Runtime configuration values from `pristine.config.ts:config`
 * are read directly by `ConfigurationManager` during kernel boot, not pre-loaded by the
 * CLI. The CLI is responsible only for module-graph assembly.
 */
export class LoadedAppModule {
  constructor(
    public readonly appModule: AppModuleInterface,
    /**
     * Plugins loaded from `pristine.config.ts:cli.plugins`. Empty when no plugins are
     * declared. Carried through so commands like `pristine info` can show what's
     * contributing extra modules to the runtime.
     */
    public readonly plugins: LoadedPlugin[],
  ) {
  }
}
