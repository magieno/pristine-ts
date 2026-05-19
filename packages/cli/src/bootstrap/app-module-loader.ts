import {injectable} from "tsyringe";
import fs from "fs";
import path from "path";
import {pathToFileURL} from "url";
import {AppModuleInterface} from "@pristine-ts/common";
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
 * exactly one supported way to specify the module — `cli.appModule.sourcePath` +
 * `cli.appModule.outputPath` in `pristine.config.ts` (or `pristine.config.js`).
 *
 * Resolution path:
 *   1. Read `pristine.config.{ts,js}` via `ConfigLoader`.
 *   2. If `cli.appModule` is configured: ensure the build is fresh (manifest check, prompt
 *      or fail on stale), then dynamically import the configured `outputPath`.
 *   3. If anything above is missing or broken: fall back to a `CliModule`-only synthetic
 *      AppModule so built-in commands (notably `pristine init`) remain runnable. This is
 *      the only escape hatch — there is no convention scan, no package.json discovery,
 *      no cached prior selection.
 *
 * **Does not read the `config:` block.** Runtime configuration values are read directly
 * by `ConfigurationManager` during kernel boot. This class is concerned only with
 * module-graph assembly.
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
   * Resolves the consumer's AppModule for the CLI. The flow has five stages:
   *
   *   1. **Read the project's pristine.config.{ts,js}** — single source of truth for
   *      where the user's AppModule lives and what plugins to wire in.
   *   2. **Check the compiled AppModule is in sync with its source** — when both
   *      `cli.appModule.sourcePath` and `cli.appModule.outputPath` are configured,
   *      compare the build manifest's recorded source hash against the current source.
   *      If they diverge (the user edited source but didn't rebuild), prompt to rebuild
   *      in an interactive terminal, or fail with an actionable error in CI /
   *      non-interactive contexts.
   *   3. **Dynamically import the compiled AppModule** — load the JS file at
   *      `outputPath` and pull out the configured named export (default `AppModule`).
   *   4. **Substitute a CliModule-only AppModule when nothing else worked** — when
   *      there is no config file, no `cli.appModule` block in the config, or the import
   *      threw, build a synthetic AppModule that imports just CliModule. This keeps the
   *      bin runnable so the user can run `pristine init`, `pristine help`, etc. to
   *      recover. There is no convention scan, no package.json discovery — only this
   *      one escape hatch.
   *   5. **Wrap with config-declared plugins** — load every plugin listed in
   *      `cli.plugins` and merge their modules into the AppModule's import graph via a
   *      synthetic outer module.
   */
  async load(): Promise<LoadedAppModule> {
    const projectRoot = process.cwd();
    let appModule: AppModuleInterface;

    let resolvedPath: string | undefined;
    let appModuleExportName = this.defaultExportName;

    // ── Stage 1: read the project's pristine.config.{ts,js}. ──
    // Walks up from cwd looking for the config file; returns an empty config object
    // when no file is found, which lets the substitute-AppModule branch in Stage 4
    // take over instead of erroring out.
    const resolvedConfig = await this.configLoader.load({startDir: projectRoot});
    const appModuleConfig = resolvedConfig.config.cli?.appModule;

    // Honor `cli.appModule.export` for projects whose AppModule isn't named `AppModule`.
    if (appModuleConfig?.export !== undefined) {
      appModuleExportName = appModuleConfig.export;
    }

    // ── Stage 2: check the compiled AppModule is in sync with its source. ──
    // Only runs when both sourcePath + outputPath are configured (the canonical setup).
    // `ensureFreshBuild` returns false when the user declined to rebuild after a
    // staleness prompt, or when we're non-interactive and stale. In either case we
    // substitute the CliModule-only AppModule so commands like `pristine init` and
    // `pristine help` still work.
    if (appModuleConfig?.sourcePath !== undefined && appModuleConfig?.outputPath !== undefined) {
      const ensured = await this.ensureFreshBuild(projectRoot, appModuleConfig.sourcePath, appModuleConfig.outputPath);
      if (ensured === false) {
        const fallbackAppModule = await this.buildFallbackAppModule(projectRoot);
        return new LoadedAppModule(fallbackAppModule, []);
      }
      resolvedPath = path.resolve(projectRoot, appModuleConfig.outputPath);
    }

    // ── Stage 3: dynamically import the AppModule (or fall through to Stage 4). ──
    if (resolvedPath !== undefined) {
      try {
        appModule = await this.importAppModule(resolvedPath, appModuleExportName);
      } catch (error) {
        // Stage 4 (the configured file is broken or missing): we don't crash — that
        // would prevent `pristine init` from running and leave the user with no way to
        // fix their config. Warn loudly, substitute the CliModule-only AppModule, and
        // let the user re-run after fixing the issue.
        process.stderr.write(
          `[pristine] Failed to load AppModule from '${resolvedPath}': ${(error as Error).message}\n` +
          `[pristine] Falling back to built-in commands only. Fix your AppModule config and re-run.\n`,
        );
        appModule = await this.buildFallbackAppModule(projectRoot);
      }
    } else {
      // Stage 4 (no `cli.appModule` block, or no config file at all): substitute the
      // CliModule-only AppModule so the bin can still bootstrap the user's project.
      // First-run case (`pristine init` from a fresh project) lands here.
      appModule = await this.buildFallbackAppModule(projectRoot);
    }

    // ── Stage 5: wrap with config-declared plugins. ──
    // Plugins declared in `pristine.config.ts:cli.plugins` contribute additional modules
    // (e.g. tooling-only modules the user doesn't want polluting their runtime AppModule).
    // A failing plugin warns but doesn't abort — the bin stays usable so the user can fix
    // the offending entry.
    let plugins: LoadedPlugin[] = [];
    try {
      plugins = await this.pluginLoader.load(resolvedConfig.config, resolvedConfig.configFilePath, projectRoot);
    } catch (error) {
      process.stderr.write(`${(error as Error).message}\n`);
      process.stderr.write("[pristine] Continuing without plugins. Fix the plugin config and re-run.\n");
    }

    if (plugins.length > 0) {
      appModule = this.pluginLoader.wrap(appModule, plugins);
    }

    return new LoadedAppModule(appModule, plugins);
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
   * Builds the safety-net AppModule used when no `cli.appModule` is configured or the
   * configured file fails to load. Scrapes any `node_modules/@pristine-ts/*` packages
   * already installed so built-in commands they contribute (e.g. `pristine list`) are
   * still available, then appends `CliModule` so at minimum the CLI's own commands run.
   * This is intentionally a one-way safety net, not a discovery tier — it only fires
   * when nothing else worked.
   */
  private async buildFallbackAppModule(projectRoot: string): Promise<AppModuleInterface> {
    const pristineNodeModulesPath = path.resolve(projectRoot, "node_modules", "@pristine-ts");
    const modules: any[] = [];

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
          if (key.endsWith("Module")) modules.push(module[key]);
        }
      }
    }

    if (modules.length === 0) {
      modules.push(CliModule);
    }

    return {
      keyname: this.fallbackKeyname,
      importModules: modules,
      importServices: [],
    };
  }
}
