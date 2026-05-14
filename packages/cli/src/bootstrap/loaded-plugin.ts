import {ModuleInterface} from "@pristine-ts/common";

/**
 * A successfully-loaded plugin. Records the package name (for collision diagnostics), the
 * absolute path it was resolved to, and every `*Module` export the plugin's entry produced.
 */
export class LoadedPlugin {
  constructor(
    /** As declared in `pristine.config.ts` plugins[] (string form or `.name` form). */
    public readonly name: string,
    /** Absolute path resolved by `createRequire` from the consumer's project. */
    public readonly resolvedPath: string,
    /** Modules harvested from the plugin's exports — one entry per `*Module` named export. */
    public readonly modules: ModuleInterface[],
  ) {
  }
}
