import {injectable} from "tsyringe";
import fs from "fs";
import path from "path";
import {pathToFileURL} from "url";
import {AppModuleInterface, ModuleInterface} from "@pristine-ts/common";
import {ModuleConfigurationValue} from "@pristine-ts/configuration";
import {LoggingModuleKeyname, OutputModeEnum, SeverityEnum} from "@pristine-ts/logging";
import {DirectoryListResultEnum, DirectoryManager, FileManager, MatchTypeEnum, TypesEnum} from "@pristine-ts/file";
import {CliModule} from "../cli.module";
import {ConfigLoader} from "../config/config-loader";
import {AppModuleCache} from "./app-module-cache";
import {AppModuleDiscoverer} from "./app-module-discoverer";
import {AppModuleDiscoveryCandidate} from "./app-module-discovery-candidate";
import {AppModulePrompt} from "./app-module-prompt";
import {DynamicImporter} from "./dynamic-importer";
import {LoadedAppModule} from "./loaded-app-module";
import {LoadedPlugin} from "./loaded-plugin";
import {PluginLoader} from "./plugin-loader";

/**
 * Resolves the consumer's AppModule and produces the default kernel configuration the CLI
 * uses. Orchestrates the full discovery cascade across the bootstrap-layer collaborators
 * (config loader, cache, discoverer, prompt, plugin loader).
 *
 * Discovery cascade (first match wins):
 *   1. `pristine.config.{ts,…}`'s `appModule.path` — canonical user config.
 *   2. `pristine.appModule.path` (or deprecated `cjsPath`) in package.json — legacy.
 *   3. `.pristine/last-app-module` — previous TTY selection cached for re-runs.
 *   4. Convention scan via `AppModuleDiscoverer`. Single match → use it. Multiple matches
 *      → prompt (TTY) or fail with an actionable error (non-TTY).
 *   5. Legacy auto-discovery from `node_modules/@pristine-ts/`, falling back to a CliModule-
 *      only synthetic AppModule so built-in commands always remain runnable.
 */
@injectable()
export class AppModuleLoader {
  private readonly defaultExportName: string = "AppModule";
  private readonly fallbackKeyname: string = "__auto_generated_app.module__";

  constructor(
    private readonly configLoader: ConfigLoader,
    private readonly cache: AppModuleCache,
    private readonly discoverer: AppModuleDiscoverer,
    private readonly prompt: AppModulePrompt,
    private readonly pluginLoader: PluginLoader,
    private readonly dynamicImporter: DynamicImporter,
  ) {
  }

  async load(): Promise<LoadedAppModule> {
    const projectRoot = process.cwd();
    let appModule: AppModuleInterface;
    let isLoggingModulePresent = false;

    let resolvedPath: string | undefined;
    let appModuleExportName = this.defaultExportName;

    const resolvedConfig = await this.configLoader.load({startDir: projectRoot});
    if (resolvedConfig.config.appModule?.path !== undefined) {
      const configDir = resolvedConfig.configFilePath !== undefined
        ? path.dirname(resolvedConfig.configFilePath)
        : projectRoot;
      resolvedPath = path.resolve(configDir, resolvedConfig.config.appModule.path);
      if (resolvedConfig.config.appModule.export !== undefined) {
        appModuleExportName = resolvedConfig.config.appModule.export;
      }
    }

    if (resolvedPath === undefined) {
      resolvedPath = this.readPackageJsonAppModulePath(projectRoot);
    }

    if (resolvedPath === undefined) {
      resolvedPath = this.cache.read(projectRoot);
    }

    if (resolvedPath === undefined) {
      resolvedPath = await this.runConventionDiscovery(projectRoot);
    }

    if (resolvedPath !== undefined) {
      try {
        appModule = await this.importAppModule(resolvedPath, appModuleExportName);
        isLoggingModulePresent = (appModule.importModules ?? []).find(m => m.keyname === LoggingModuleKeyname) !== undefined;
      } catch (error) {
        // The configured AppModule file is missing or broken. Rather than crashing the bin
        // (which would prevent even built-in commands like `p:config:init` from running,
        // leaving the user with no way to fix their config), warn loudly and fall back to a
        // CliModule-only AppModule so the bin stays operational.
        process.stderr.write(
          `[pristine] Failed to load AppModule from '${resolvedPath}': ${(error as Error).message}\n` +
          `[pristine] Falling back to built-in commands only. Fix your AppModule config and re-run.\n`,
        );
        const fallback = await this.buildAutoDiscoveredAppModule(projectRoot);
        appModule = fallback.appModule;
        isLoggingModulePresent = fallback.isLoggingModulePresent;
      }
    } else {
      const fallback = await this.buildAutoDiscoveredAppModule(projectRoot);
      appModule = fallback.appModule;
      isLoggingModulePresent = fallback.isLoggingModulePresent;
    }

    let plugins: LoadedPlugin[] = [];
    try {
      plugins = await this.pluginLoader.load(resolvedConfig.config, resolvedConfig.configFilePath, projectRoot);
    } catch (error) {
      process.stderr.write(`${(error as Error).message}\n`);
      process.stderr.write("[pristine] Continuing without plugins. Fix the plugin config and re-run.\n");
    }

    if (plugins.length > 0) {
      appModule = this.pluginLoader.wrap(appModule, plugins);
      // Re-check for LoggingModule — a plugin could legitimately contribute it.
      if (isLoggingModulePresent === false) {
        isLoggingModulePresent = (appModule.importModules ?? []).find(m => m.keyname === LoggingModuleKeyname) !== undefined;
      }
    }

    const configuration = this.buildKernelConfiguration(isLoggingModulePresent, resolvedConfig.config.kernelConfiguration);
    return new LoadedAppModule(appModule, configuration, isLoggingModulePresent, plugins);
  }

  /**
   * Reads the consumer's `package.json` and returns an absolute path to the configured
   * AppModule file. Prefers `pristine.appModule.path` (new, format-agnostic) over
   * `pristine.appModule.cjsPath` (deprecated; kept for one minor cycle with a warning).
   * @private
   */
  private readPackageJsonAppModulePath(projectRoot: string): string | undefined {
    const packageJsonPath = path.resolve(projectRoot, "package.json");
    if (fs.existsSync(packageJsonPath) === false) return undefined;

    let parsed: any;
    try {
      parsed = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    } catch {
      return undefined;
    }

    const pristine = parsed?.pristine?.appModule;
    if (pristine === undefined) return undefined;

    if (typeof pristine.path === "string" && pristine.path.length > 0) {
      return path.resolve(projectRoot, pristine.path);
    }

    if (typeof pristine.cjsPath === "string" && pristine.cjsPath.length > 0) {
      process.stderr.write(
        "[pristine] DEPRECATED: package.json `pristine.appModule.cjsPath` will be removed in a future release. " +
        "Rename to `pristine.appModule.path` (it accepts any module format: .js, .mjs, .cjs).\n",
      );
      return path.resolve(projectRoot, pristine.cjsPath);
    }

    return undefined;
  }

  private async runConventionDiscovery(projectRoot: string): Promise<string | undefined> {
    const candidates = await this.discoverer.discover(projectRoot);
    if (candidates.length === 0) return undefined;
    if (candidates.length === 1) return candidates[0].absolutePath;

    // Multiple candidates: if one strictly outranks the rest (e.g. one `app.module.js` plus
    // other `*.module.*` files that happen to export an AppModule symbol), pick the top one
    // without asking. Otherwise prompt the user (TTY) or fail with an actionable error.
    const top = candidates[0];
    const tied = candidates.filter(c => c.score === top.score);
    if (tied.length === 1) return top.absolutePath;

    return this.resolveAmbiguousCandidates(projectRoot, tied);
  }

  private async resolveAmbiguousCandidates(projectRoot: string, candidates: AppModuleDiscoveryCandidate[]): Promise<string> {
    if (this.prompt.isInteractive() === false) {
      const list = candidates.map(c => `  - ${c.displayPath}`).join("\n");
      throw new Error(
        `[pristine] Found ${candidates.length} AppModule candidates and cannot prompt (no interactive terminal):\n` +
        `${list}\n\n` +
        `Disambiguate by setting \`pristine.appModule.path\` in package.json, e.g.:\n` +
        `  "pristine": { "appModule": { "path": "${candidates[0].displayPath}" } }`,
      );
    }

    const selected = await this.prompt.prompt(candidates);
    if (selected === undefined) {
      throw new Error("[pristine] AppModule selection cancelled.");
    }
    this.cache.write(projectRoot, selected);
    return selected;
  }

  /**
   * Imports the AppModule from an absolute path. Wraps the path in a `file://` URL — bare
   * absolute paths cannot be passed to dynamic `import()` for ESM resolution, and on Windows
   * raw paths break altogether. Accepts `.js`, `.mjs`, `.cjs`.
   * @private
   */
  private async importAppModule(absolutePath: string, exportName: string): Promise<AppModuleInterface> {
    const url = pathToFileURL(absolutePath).href;
    const loaded = await this.dynamicImporter.import(url);

    if (!loaded || !loaded[exportName]) {
      throw new Error(
        `[pristine] The file at '${absolutePath}' was loaded but did not export '${exportName}'. ` +
        `Make sure your AppModule file does \`export const ${exportName}: AppModuleInterface = { ... }\`.`,
      );
    }

    return loaded[exportName] as AppModuleInterface;
  }

  /**
   * Last-resort fallback. Scans `node_modules/@pristine-ts/` for every `*.module.js` it can
   * find and synthesizes an AppModule from the harvested exports. When no such packages
   * exist either (e.g. the bin was invoked outside any project), falls back further to a
   * CliModule-only synthetic AppModule so built-in commands always remain runnable.
   * @private
   */
  private async buildAutoDiscoveredAppModule(projectRoot: string): Promise<{appModule: AppModuleInterface; isLoggingModulePresent: boolean}> {
    const pristineNodeModulesPath = path.resolve(projectRoot, "node_modules", "@pristine-ts");
    const modules: any[] = [];
    let isLoggingModulePresent = false;

    if (fs.existsSync(pristineNodeModulesPath)) {
      const directoryManager = new DirectoryManager(new FileManager());
      const moduleFiles = await directoryManager.list(pristineNodeModulesPath, {
        matchType: MatchTypeEnum.Path,
        match: /.*\/cjs\/.*\.module\.js$/,
        types: TypesEnum.File,
        resultType: DirectoryListResultEnum.FilePath,
        recurse: true,
      });

      for (const moduleFile of moduleFiles) {
        const module = await this.dynamicImporter.import(pathToFileURL(moduleFile as string).href);
        for (const key in module) {
          if (key === "LoggingModule") isLoggingModulePresent = true;
          if (key.endsWith("Module")) modules.push(module[key]);
        }
      }
    }

    if (modules.length === 0) {
      modules.push(CliModule);
    }

    return {
      appModule: {
        keyname: this.fallbackKeyname,
        importModules: modules,
        importServices: [],
      },
      isLoggingModulePresent,
    };
  }

  private buildKernelConfiguration(isLoggingModulePresent: boolean, userKernelConfiguration: Record<string, unknown> | undefined): { [key: string]: ModuleConfigurationValue } {
    const configuration: { [key: string]: ModuleConfigurationValue } = {};

    if (isLoggingModulePresent) {
      configuration[LoggingModuleKeyname + ".consoleLoggerOutputMode"] = OutputModeEnum.Simple;
      configuration[LoggingModuleKeyname + ".logSeverityLevelConfiguration"] = SeverityEnum.Error;
    }

    // User-supplied kernelConfiguration overrides the CLI defaults. This is how a consumer
    // can opt back into JSON logging or raise verbosity for the CLI specifically without
    // touching their AppModule's configuration definitions.
    if (userKernelConfiguration !== undefined) {
      Object.assign(configuration, userKernelConfiguration);
    }

    return configuration;
  }
}
