import {createRequire} from "module";
import path from "path";
import {pathToFileURL} from "url";
import {AppModuleInterface, ModuleInterface} from "@pristine-ts/common";
import {PristineConfig} from "../config/pristine-config.interface";

/**
 * A successfully-loaded plugin: every `*Module` export the plugin's entry file produced,
 * plus the plugin's package name (for collision diagnostics) and the absolute path it was
 * loaded from.
 */
export interface LoadedPlugin {
  /** As declared in `pristine.config.ts` plugins[] (string form or `.name` form). */
  name: string;
  /** Absolute path resolved by `createRequire`. */
  resolvedPath: string;
  /** Modules harvested from the plugin's exports — one entry per `*Module` named export. */
  modules: ModuleInterface[];
}

/**
 * Real `import()`. tsc + esbuild lower `await import()` to `require()` in CJS output, which
 * breaks ESM-only plugins. The Function constructor's body is opaque to both, so the
 * `import()` inside survives unrewritten and runs as Node's real dynamic import at runtime.
 */
const dynamicImport = new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<any>;

/**
 * Resolves and loads every plugin declared in `config.plugins`. Plugin packages are resolved
 * **from the user's project**, not from the CLI's install location — a plugin lives in the
 * consumer's `node_modules`, not in `@pristine-ts/cli/node_modules`. Without `createRequire`
 * pinned to the project location, `import("@my-org/plugin")` would walk up from the bin's
 * install dir and miss it.
 *
 * Returns a `LoadedPlugin` per declared plugin. A plugin that fails to load surfaces as a
 * thrown error rather than being silently skipped — silent plugin loading is a footgun that
 * makes "why isn't my command showing up" debuggable only by reading source.
 */
export const loadPlugins = async (config: PristineConfig, configFilePath: string | undefined, projectRoot: string): Promise<LoadedPlugin[]> => {
  const plugins = config.plugins ?? [];
  if (plugins.length === 0) {
    return [];
  }

  // `createRequire` needs a "from" file to anchor resolution. When a config file exists, use
  // it (so plugins resolve relative to where the config lives — important in monorepos). When
  // no config file exists but plugins are somehow declared anyway, anchor to the project root.
  const anchor = configFilePath ?? path.join(projectRoot, "package.json");
  const requireFn = createRequire(pathToFileURL(anchor).href);

  const loaded: LoadedPlugin[] = [];

  for (const entry of plugins) {
    const name = typeof entry === "string" ? entry : entry.name;

    let resolvedPath: string;
    try {
      resolvedPath = requireFn.resolve(name);
    } catch (error) {
      throw new Error(
        `[pristine] Failed to resolve plugin '${name}' from '${anchor}': ${(error as Error).message}. ` +
        `Make sure the plugin package is installed in your project's node_modules.`
      );
    }

    let imported: any;
    try {
      imported = await dynamicImport(pathToFileURL(resolvedPath).href);
    } catch (error) {
      throw new Error(`[pristine] Failed to import plugin '${name}' from '${resolvedPath}': ${(error as Error).message}`);
    }

    const modules = harvestModuleExports(imported);
    if (modules.length === 0) {
      throw new Error(
        `[pristine] Plugin '${name}' exported no '*Module' symbols. A plugin must export at least one ` +
        `ModuleInterface (e.g. \`export const FooModule: ModuleInterface = { keyname: "...", ... }\`).`
      );
    }

    loaded.push({name, resolvedPath, modules});
  }

  return loaded;
}

/**
 * Walks a module's exports collecting every value whose name ends in "Module" and looks like
 * a `ModuleInterface` (has a `keyname` string). The `*Module` naming convention is the same
 * one the legacy `node_modules/@pristine-ts/*` auto-discovery uses, so plugin authors don't
 * need to learn a new pattern.
 */
const harvestModuleExports = (imported: any): ModuleInterface[] => {
  const modules: ModuleInterface[] = [];
  // Plugins authored as ESM expose a default export; CJS plugins expose named exports
  // directly on the module namespace. Try both.
  const candidates = [imported, imported?.default].filter(o => o !== undefined && o !== null);

  for (const candidate of candidates) {
    for (const key of Object.keys(candidate)) {
      if (key.endsWith("Module") === false) {
        continue;
      }
      const value = candidate[key];
      if (value !== null && typeof value === "object" && typeof value.keyname === "string") {
        modules.push(value);
      }
    }
  }

  return modules;
}

/**
 * Wraps the user's `AppModule` so that the plugin-contributed modules are imported alongside
 * it. The wrapper preserves the user's keyname (`<keyname> + ".with-plugins"`) so introspection
 * tools (`pristine info`) still surface a recognizable label.
 *
 * Modules are deduplicated by reference: if a plugin and the user's AppModule both import the
 * same `LoggingModule` instance, it appears once.
 */
export const wrapAppModuleWithPlugins = (appModule: AppModuleInterface, plugins: LoadedPlugin[]): AppModuleInterface => {
  if (plugins.length === 0) {
    return appModule;
  }

  const seen = new Set<ModuleInterface>();
  const importModules: ModuleInterface[] = [];

  const add = (m: ModuleInterface) => {
    if (seen.has(m)) return;
    seen.add(m);
    importModules.push(m);
  }

  add(appModule);
  for (const plugin of plugins) {
    for (const module of plugin.modules) {
      add(module);
    }
  }

  return {
    keyname: `${appModule.keyname}.with-plugins`,
    importModules,
    importServices: appModule.importServices ?? [],
  };
}
