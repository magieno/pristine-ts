import {injectable} from "tsyringe";
import fs from "fs";
import path from "path";
import {pathToFileURL} from "url";
import {AppModuleInterface} from "@pristine-ts/common";
import {ModuleConfigurationValue} from "@pristine-ts/configuration";
import {LoggingModuleKeyname, OutputModeEnum, SeverityEnum} from "@pristine-ts/logging";
import {DirectoryListResultEnum, DirectoryManager, FileManager, MatchTypeEnum, TypesEnum} from "@pristine-ts/file";
import {CliModule} from "../cli.module";
import {ConfigLoader} from "../config/config-loader";
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
 * Resolves the consumer's AppModule. The contract is intentionally narrow: there is
 * exactly one supported way to specify the module — `appModule.sourcePath` +
 * `appModule.outputPath` in `pristine.config.ts` (or `pristine.config.js`).
 *
 * Resolution path:
 *   1. Read `pristine.config.{ts,js}` via `ConfigLoader`.
 *   2. If `appModule` is configured: ensure the build is fresh (manifest check, prompt or
 *      fail on stale), then dynamically import the configured `outputPath`.
 *   3. If anything above is missing or broken: fall back to a `CliModule`-only synthetic
 *      AppModule so built-in commands (notably `pristine init`) remain runnable. This is
 *      the only escape hatch — there is no convention scan, no package.json discovery,
 *      no cached prior selection.
 */
@injectable()
export class AppModuleLoader {
  private readonly defaultExportName: string = "AppModule";
  private readonly fallbackKeyname: string = "__auto_generated_app.module__";

  constructor(
    private readonly configLoader: ConfigLoader,
    private readonly pluginLoader: PluginLoader,
    private readonly dynamicImporter: DynamicImporter,
    private readonly buildManifestReader: BuildManifestReader,
    private readonly buildManifestChecker: BuildManifestChecker,
    private readonly buildStalenessPrompt: BuildStalenessPrompt,
    private readonly buildRunner: BuildRunner,
  ) {
  }

  /**
   * Resolves the consumer's AppModule and the kernel configuration the CLI should boot
   * with. The flow has five stages, executed in order:
   *
   *   1. **Read pristine.config.{ts,js}** — single source of truth for where the
   *      AppModule lives and what plugins to wire in.
   *   2. **Build manifest gate** — when `appModule.{sourcePath, outputPath}` is set,
   *      check whether the compiled output is fresh against its source. Stale → prompt
   *      to rebuild (TTY) or fail with an actionable error (non-TTY).
   *   3. **Import the AppModule** — dynamically load the compiled `outputPath` and pull
   *      out the configured export (default `AppModule`).
   *   4. **Safety net** — when there is no config, no `appModule` block, or the import
   *      fails, fall back to a CliModule-only synthetic AppModule so the bin remains
   *      usable. This is the only escape hatch — there is no convention scan and no
   *      package.json discovery.
   *   5. **Plugin wrap** — load plugins declared in the config and wrap the AppModule
   *      so plugin-contributed modules end up in the kernel's import graph.
   *
   * Final output: a `LoadedAppModule` carrying the (possibly wrapped) AppModule, the
   * kernel configuration overlay, the logging-module-present flag, and the loaded
   * plugin list.
   */
  async load(): Promise<LoadedAppModule> {
    const projectRoot = process.cwd();
    let appModule: AppModuleInterface;
    let isLoggingModulePresent = false;

    let resolvedPath: string | undefined;
    let appModuleExportName = this.defaultExportName;

    // ── Stage 1: read the config file (pristine.config.ts or pristine.config.js). ──
    // Walks up from cwd; returns an empty config when no file is found, which lets the
    // safety net in Stage 4 take over instead of erroring out.
    const resolvedConfig = await this.configLoader.load({startDir: projectRoot});
    const appModuleConfig = resolvedConfig.config.appModule;

    // Honor `appModule.export` for projects whose AppModule isn't named `AppModule`.
    if (appModuleConfig?.export !== undefined) {
      appModuleExportName = appModuleConfig.export;
    }

    // ── Stage 2: build manifest gate. ──
    // Only runs when both sourcePath + outputPath are configured (the canonical setup).
    // `ensureFreshBuild` returns false when the user declined to rebuild a stale output,
    // or when we're non-interactive and stale. In either case we bail to the safety net
    // so commands like `pristine init` and `pristine help` still work.
    if (appModuleConfig?.sourcePath !== undefined && appModuleConfig?.outputPath !== undefined) {
      const ensured = await this.ensureFreshBuild(projectRoot, appModuleConfig.sourcePath, appModuleConfig.outputPath);
      if (ensured === false) {
        const fallback = await this.buildFallbackAppModule(projectRoot);
        return new LoadedAppModule(
          fallback.appModule,
          this.buildKernelConfiguration(fallback.isLoggingModulePresent, resolvedConfig.config.kernelConfiguration),
          fallback.isLoggingModulePresent,
          [],
        );
      }
      resolvedPath = path.resolve(projectRoot, appModuleConfig.outputPath);
    }

    // ── Stage 3: dynamic import of the AppModule, OR Stage 4 safety net. ──
    if (resolvedPath !== undefined) {
      // Stage 3: dynamic import. The compiled output is a regular JS module; we pull
      // out the named export and detect LoggingModule presence so Stage 5 can decide
      // whether to install the CLI's default console-logger configuration overlay.
      try {
        appModule = await this.importAppModule(resolvedPath, appModuleExportName);
        isLoggingModulePresent = (appModule.importModules ?? []).find(m => m.keyname === LoggingModuleKeyname) !== undefined;
      } catch (error) {
        // Stage 4 (failure flavor): the configured AppModule file is missing or broken.
        // We don't crash — that would prevent `pristine init` from running and leave
        // the user with no way to fix their config. Warn loudly, fall back to the
        // CliModule-only synthetic AppModule, and let the user re-run.
        process.stderr.write(
          `[pristine] Failed to load AppModule from '${resolvedPath}': ${(error as Error).message}\n` +
          `[pristine] Falling back to built-in commands only. Fix your AppModule config and re-run.\n`,
        );
        const fallback = await this.buildFallbackAppModule(projectRoot);
        appModule = fallback.appModule;
        isLoggingModulePresent = fallback.isLoggingModulePresent;
      }
    } else {
      // Stage 4 (no-config flavor): no `appModule` block, or no config file at all.
      // First-run case (`pristine init` from a fresh project) lands here. Same safety
      // net so the bin can still bootstrap the user's project.
      const fallback = await this.buildFallbackAppModule(projectRoot);
      appModule = fallback.appModule;
      isLoggingModulePresent = fallback.isLoggingModulePresent;
    }

    // ── Stage 5: plugin loading + wrap. ──
    // Plugins declared in the config contribute additional modules (e.g. tooling-only
    // modules a user doesn't want in their runtime AppModule). A failing plugin warns
    // but doesn't abort — the bin stays usable so the user can fix the offending entry.
    let plugins: LoadedPlugin[] = [];
    try {
      plugins = await this.pluginLoader.load(resolvedConfig.config, resolvedConfig.configFilePath, projectRoot);
    } catch (error) {
      process.stderr.write(`${(error as Error).message}\n`);
      process.stderr.write("[pristine] Continuing without plugins. Fix the plugin config and re-run.\n");
    }

    if (plugins.length > 0) {
      // Wrap the AppModule with a synthetic outer module that imports both the user's
      // module and every plugin. Re-detect logging because a plugin could have brought
      // it in.
      appModule = this.pluginLoader.wrap(appModule, plugins);
      if (isLoggingModulePresent === false) {
        isLoggingModulePresent = (appModule.importModules ?? []).find(m => m.keyname === LoggingModuleKeyname) !== undefined;
      }
    }

    // ── Final: assemble the kernel configuration overlay and return. ──
    // The CLI installs sensible defaults for LoggingModule (simple output mode, error-
    // level threshold) when LoggingModule is present, then layers the user's
    // `kernelConfiguration` on top so they can override anything they want.
    const configuration = this.buildKernelConfiguration(isLoggingModulePresent, resolvedConfig.config.kernelConfiguration);
    return new LoadedAppModule(appModule, configuration, isLoggingModulePresent, plugins);
  }

  /**
   * Manifest gate. Checks whether the build manifest still describes the current source/output
   * paths and source content. If not, prompts the user (TTY) or fails (non-TTY) with a clear
   * explanation. On a successful inline rebuild, returns true.
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

    // No manifest on disk → user is building with their own pipeline (raw `tsc`, esbuild,
    // a CI step, etc.) and never invoking `pristine build`. The manifest's purpose is to
    // detect drift between source and a Pristine-managed build; with no manifest there is
    // nothing to compare against, so we skip the gate. We still require the configured
    // `outputPath` to exist — otherwise there's nothing to load.
    if (staleness === BuildManifestStalenessEnum.Missing) {
      const absoluteOutput = path.resolve(projectRoot, outputPath);
      if (fs.existsSync(absoluteOutput)) {
        return true;
      }
      // Fall through to the "stale" path below — the output is genuinely missing,
      // which the prompt/non-TTY branches handle with the right error message.
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
   * Builds the safety-net AppModule used when no `appModule` is configured or the configured
   * file fails to load. Scrapes any `node_modules/@pristine-ts/*` packages already installed
   * so built-in commands they contribute (e.g. `pristine list`) are still available, then
   * appends `CliModule` so at minimum the CLI's own commands run. This is intentionally a
   * one-way safety net, not a discovery tier — it only fires when nothing else worked.
   */
  private async buildFallbackAppModule(projectRoot: string): Promise<{appModule: AppModuleInterface; isLoggingModulePresent: boolean}> {
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
