import {injectable} from "tsyringe";
import {createRequire} from "module";
import path from "path";
import {pathToFileURL} from "url";
import {AppModuleInterface, ModuleInterface} from "@pristine-ts/common";
import {PristineConfig} from "../config/pristine-config.interface";
import {DynamicImporter} from "./dynamic-importer";
import {LoadedPlugin} from "./loaded-plugin";

/**
 * Resolves and loads every plugin declared in `config.cli.plugins`. Plugin packages are resolved
 * from the **consumer's project**, not from the CLI's install location — a plugin lives in
 * the consumer's `node_modules`, not in `@pristine-ts/cli/node_modules`. Without
 * `createRequire` pinned to the project location, `import("@my-org/plugin")` would walk up
 * from the bin's install dir and miss it.
 *
 * A plugin that fails to load surfaces as a thrown error rather than being silently skipped —
 * silent plugin loading is a footgun that makes "why isn't my command showing up" debuggable
 * only by reading source.
 */
@injectable()
export class PluginLoader {
  constructor(private readonly dynamicImporter: DynamicImporter) {
  }

  async load(config: PristineConfig, configFilePath: string | undefined, projectRoot: string): Promise<LoadedPlugin[]> {
    const plugins = config.cli?.plugins ?? [];
    if (plugins.length === 0) {
      return [];
    }

    // `createRequire` needs a "from" file to anchor resolution. When a config file exists,
    // use it (so plugins resolve relative to where the config lives — important in monorepos).
    // When no config file exists but plugins are somehow declared, anchor to the project root.
    const anchor = configFilePath ?? path.join(projectRoot, "package.json");
    const requireFn = createRequire(pathToFileURL(anchor).href);

    const loaded: LoadedPlugin[] = [];

    for (const entry of plugins) {
      const name = typeof entry === "string" ? entry : entry.name;
      const resolvedPath = this.resolvePluginPath(name, requireFn, anchor);
      const imported = await this.importPlugin(name, resolvedPath);
      const modules = this.harvestModuleExports(imported);

      if (modules.length === 0) {
        throw new Error(
          `[pristine] Plugin '${name}' exported no '*Module' symbols. A plugin must export at least one ` +
          `ModuleInterface (e.g. \`export const FooModule: ModuleInterface = { keyname: "...", ... }\`).`,
        );
      }

      loaded.push(new LoadedPlugin(name, resolvedPath, modules));
    }

    return loaded;
  }

  /**
   * Synthesizes an outer AppModule whose `importModules` includes the user's AppModule plus
   * every plugin-contributed module, deduplicated by reference. Preserves the user's keyname
   * (suffixed with `.with-plugins`) so introspection tools (`pristine info`) still surface a
   * recognizable label.
   */
  wrap(appModule: AppModuleInterface, plugins: LoadedPlugin[]): AppModuleInterface {
    if (plugins.length === 0) {
      return appModule;
    }

    const seen = new Set<ModuleInterface>();
    const importModules: ModuleInterface[] = [];

    const add = (m: ModuleInterface) => {
      if (seen.has(m)) return;
      seen.add(m);
      importModules.push(m);
    };

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

  private resolvePluginPath(name: string, requireFn: NodeRequire, anchor: string): string {
    try {
      return requireFn.resolve(name);
    } catch (error) {
      throw new Error(
        `[pristine] Failed to resolve plugin '${name}' from '${anchor}': ${(error as Error).message}. ` +
        `Make sure the plugin package is installed in your project's node_modules.`,
      );
    }
  }

  private async importPlugin(name: string, resolvedPath: string): Promise<any> {
    try {
      return await this.dynamicImporter.import(pathToFileURL(resolvedPath).href);
    } catch (error) {
      throw new Error(`[pristine] Failed to import plugin '${name}' from '${resolvedPath}': ${(error as Error).message}`);
    }
  }

  /**
   * Walks a plugin's exports collecting every value whose name ends in `Module` and looks
   * like a `ModuleInterface` (has a `keyname` string). Accepts both ESM (default export) and
   * CJS (named exports on the module namespace) plugin shapes.
   */
  private harvestModuleExports(imported: any): ModuleInterface[] {
    const modules: ModuleInterface[] = [];
    const candidates = [imported, imported?.default].filter(o => o !== undefined && o !== null);

    for (const candidate of candidates) {
      for (const key of Object.keys(candidate)) {
        if (key.endsWith("Module") === false) continue;
        const value = candidate[key];
        if (value !== null && typeof value === "object" && typeof value.keyname === "string") {
          modules.push(value);
        }
      }
    }

    return modules;
  }
}
