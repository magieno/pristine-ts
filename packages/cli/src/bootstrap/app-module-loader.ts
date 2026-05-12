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
import {BuildManifestChecker} from "./build-manifest-checker";
import {BuildManifestReader} from "./build-manifest-reader";
import {BuildManifestStalenessEnum} from "./build-manifest-staleness.enum";
import {BuildRunner} from "./build-runner";
import {BuildStalenessPrompt} from "./build-staleness-prompt";
import {DynamicImporter} from "./dynamic-importer";
import {LoadedAppModule} from "./loaded-app-module";
import {LoadedPlugin} from "./loaded-plugin";
import {PluginLoader} from "./plugin-loader";

/**
 * Resolves the consumer's AppModule and produces the default kernel configuration the CLI
 * uses. Orchestrates the full discovery cascade across the bootstrap-layer collaborators.
 *
 * Discovery cascade (first match wins):
 *   1. `pristine.config.{ts,…}`'s `appModule.{sourcePath, outputPath}` — canonical path
 *      when using `pristine build`. The build manifest is checked for staleness; stale →
 *      prompt (TTY) or fail with actionable error (non-TTY).
 *   2. `pristine.config.{ts,…}`'s `appModule.outputPath` alone (no sourcePath) — direct
 *      load without manifest involvement; for users who compile externally.
 *   3. Deprecated `appModule.path` from config — load with deprecation warning.
 *   4. `pristine.appModule.{path, cjsPath}` in package.json — legacy.
 *   5. `.pristine/last-app-module` — previous TTY selection cached for re-runs.
 *   6. Convention scan via `AppModuleDiscoverer` — depth-1 fallback for greenfield projects.
 *   7. Legacy auto-discovery from `node_modules/@pristine-ts/`, falling back to a CliModule-
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
    private readonly buildManifestReader: BuildManifestReader,
    private readonly buildManifestChecker: BuildManifestChecker,
    private readonly buildStalenessPrompt: BuildStalenessPrompt,
    private readonly buildRunner: BuildRunner,
  ) {
  }

  async load(): Promise<LoadedAppModule> {
    const projectRoot = process.cwd();
    let appModule: AppModuleInterface;
    let isLoggingModulePresent = false;

    let resolvedPath: string | undefined;
    let appModuleExportName = this.defaultExportName;

    const resolvedConfig = await this.configLoader.load({startDir: projectRoot});
    const appModuleConfig = resolvedConfig.config.appModule;

    if (appModuleConfig?.export !== undefined) {
      appModuleExportName = appModuleConfig.export;
    }

    // Tier 1: source + output configured → manifest-aware load.
    if (appModuleConfig?.sourcePath !== undefined && appModuleConfig?.outputPath !== undefined) {
      const ensured = await this.ensureFreshBuild(projectRoot, appModuleConfig.sourcePath, appModuleConfig.outputPath);
      if (ensured === false) {
        // User declined to rebuild (or non-TTY exit). Stop the load entirely — the bin can
        // still run a fallback CliModule for built-in commands.
        const fallback = await this.buildAutoDiscoveredAppModule(projectRoot);
        return new LoadedAppModule(
          fallback.appModule,
          this.buildKernelConfiguration(fallback.isLoggingModulePresent, resolvedConfig.config.kernelConfiguration),
          fallback.isLoggingModulePresent,
          [],
        );
      }
      resolvedPath = path.resolve(projectRoot, appModuleConfig.outputPath);
    }

    // Tier 2: outputPath alone (no sourcePath) → direct load, no manifest involvement.
    if (resolvedPath === undefined && appModuleConfig?.outputPath !== undefined) {
      resolvedPath = path.resolve(projectRoot, appModuleConfig.outputPath);
    }

    // Tier 3: deprecated `appModule.path` from config.
    if (resolvedPath === undefined && appModuleConfig?.path !== undefined) {
      process.stderr.write(
        "[pristine] DEPRECATED: pristine.config.ts `appModule.path` will be removed in a future release. " +
        "Run `pristine init` to migrate to `appModule.sourcePath` + `appModule.outputPath`.\n",
      );
      const configDir = resolvedConfig.configFilePath !== undefined
        ? path.dirname(resolvedConfig.configFilePath)
        : projectRoot;
      resolvedPath = path.resolve(configDir, appModuleConfig.path);
    }

    // Tier 4: package.json legacy fields.
    if (resolvedPath === undefined) {
      resolvedPath = this.readPackageJsonAppModulePath(projectRoot);
    }

    // Tier 5: cached selection from a prior TTY prompt.
    if (resolvedPath === undefined) {
      resolvedPath = this.cache.read(projectRoot);
    }

    // Tier 6: convention-based discovery.
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
      // Tier 7: node_modules/@pristine-ts/* + CliModule-only fallback.
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
      if (isLoggingModulePresent === false) {
        isLoggingModulePresent = (appModule.importModules ?? []).find(m => m.keyname === LoggingModuleKeyname) !== undefined;
      }
    }

    const configuration = this.buildKernelConfiguration(isLoggingModulePresent, resolvedConfig.config.kernelConfiguration);
    return new LoadedAppModule(appModule, configuration, isLoggingModulePresent, plugins);
  }

  /**
   * Tier 1's manifest gate. Checks whether the build manifest still describes the current
   * source/output paths and source content. If not, prompts the user (TTY) or fails (non-TTY)
   * with a clear explanation. On a successful inline rebuild, returns true.
   *
   * Returns true when the build is fresh or just got rebuilt; false when the user declined to
   * rebuild or when non-TTY hit a stale state. Callers should treat false as "stop the load".
   * @private
   */
  private async ensureFreshBuild(projectRoot: string, sourcePath: string, outputPath: string): Promise<boolean> {
    const manifest = this.buildManifestReader.read(projectRoot);
    const staleness = this.buildManifestChecker.check(manifest, projectRoot, sourcePath, outputPath);

    if (staleness === BuildManifestStalenessEnum.Fresh) {
      return true;
    }

    const explanation = this.buildStalenessPrompt.describe(staleness);

    if (this.buildStalenessPrompt.isInteractive() === false) {
      process.stderr.write(`[pristine] ${explanation}\n`);
      return false;
    }

    const shouldRebuild = await this.buildStalenessPrompt.prompt(staleness);
    if (shouldRebuild !== true) {
      process.stderr.write(`[pristine] ${explanation}\n`);
      return false;
    }

    process.stderr.write(`[pristine] Rebuilding...\n`);
    const buildSucceeded = this.buildRunner.run();
    if (buildSucceeded === false) {
      process.stderr.write(`[pristine] Rebuild failed. Fix the build error and re-run.\n`);
      return false;
    }

    // After a successful rebuild, re-check that the manifest now passes — guards against the
    // edge case where `pristine build` ran but, for whatever reason (unconfigured paths,
    // tsconfig mismatch), didn't write a fresh manifest.
    const reReadManifest = this.buildManifestReader.read(projectRoot);
    const recheckStaleness = this.buildManifestChecker.check(reReadManifest, projectRoot, sourcePath, outputPath);
    if (recheckStaleness !== BuildManifestStalenessEnum.Fresh) {
      process.stderr.write(`[pristine] Build ran but manifest is still stale: ${this.buildStalenessPrompt.describe(recheckStaleness)}\n`);
      return false;
    }

    return true;
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
        "Run `pristine init` to migrate to a `pristine.config.ts`.\n",
      );
      return path.resolve(projectRoot, pristine.cjsPath);
    }

    return undefined;
  }

  private async runConventionDiscovery(projectRoot: string): Promise<string | undefined> {
    const candidates = await this.discoverer.discover(projectRoot);
    if (candidates.length === 0) return undefined;
    if (candidates.length === 1) return candidates[0].absolutePath;

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
        `Disambiguate by setting \`pristine.appModule.outputPath\` in pristine.config.ts (run \`pristine init\` to scaffold), e.g.:\n` +
        `  appModule: { outputPath: "${candidates[0].displayPath}" }`,
      );
    }

    const selected = await this.prompt.prompt(candidates);
    if (selected === undefined) {
      throw new Error("[pristine] AppModule selection cancelled.");
    }
    this.cache.write(projectRoot, selected);
    return selected;
  }

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

    if (userKernelConfiguration !== undefined) {
      Object.assign(configuration, userKernelConfiguration);
    }

    return configuration;
  }
}
