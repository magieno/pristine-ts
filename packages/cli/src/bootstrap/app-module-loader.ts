import fs from "fs";
import path from "path";
import {pathToFileURL} from "url";
import {AppModuleInterface} from "@pristine-ts/common";
import {ModuleConfigurationValue} from "@pristine-ts/configuration";
import {LoggingModuleKeyname, OutputModeEnum, SeverityEnum} from "@pristine-ts/logging";
import {DirectoryListResultEnum, DirectoryManager, FileManager, MatchTypeEnum, TypesEnum} from "@pristine-ts/file";
import {CliModule} from "../cli.module";
import {discoverAppModuleCandidates, AppModuleCandidate} from "./app-module-discovery";
import {readCachedAppModulePath, writeCachedAppModulePath} from "./app-module-cache";
import {isInteractive, promptForCandidate} from "./app-module-prompt";
import {loadConfig} from "../config/config-loader";
import {LoadedPlugin, loadPlugins, wrapAppModuleWithPlugins} from "./plugin-loader";

export interface LoadedAppModule {
  appModule: AppModuleInterface;
  configuration: { [key: string]: ModuleConfigurationValue };
  isLoggingModulePresent: boolean;
  /**
   * Plugins loaded from `pristine.config.ts`'s `plugins` array. Empty when no plugins are
   * declared. Carried through so commands like `pristine info` can show what's contributing
   * extra modules to the runtime.
   */
  plugins: LoadedPlugin[];
}

/**
 * Reads the consumer's `package.json` and returns an absolute path to the configured AppModule
 * file, or undefined if no configuration is present. Prefers `pristine.appModule.path` (the new,
 * format-agnostic field) over `pristine.appModule.cjsPath` (deprecated; kept for one minor cycle
 * with a one-line warning).
 */
const getConfiguredAppModulePath = (projectRoot: string): string | undefined => {
  const packageJson = path.resolve(projectRoot, "package.json");
  if (fs.existsSync(packageJson) === false) {
    return undefined;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(fs.readFileSync(packageJson, "utf8"));
  } catch {
    return undefined;
  }

  const pristine = parsed?.pristine?.appModule;
  if (pristine === undefined) {
    return undefined;
  }

  if (typeof pristine.path === "string" && pristine.path.length > 0) {
    return path.resolve(projectRoot, pristine.path);
  }

  if (typeof pristine.cjsPath === "string" && pristine.cjsPath.length > 0) {
    process.stderr.write(
      "[pristine] DEPRECATED: package.json `pristine.appModule.cjsPath` will be removed in a future release. " +
      "Rename to `pristine.appModule.path` (it accepts any module format: .js, .mjs, .cjs).\n"
    );
    return path.resolve(projectRoot, pristine.cjsPath);
  }

  return undefined;
}

/**
 * Real `import()`. tsc's CJS output lowers `await import(x)` to `require(x)`, which
 * (a) breaks for ESM consumer code, and (b) doesn't accept `file://` URLs. The Function
 * constructor's body is opaque to both tsc and esbuild's static analysis, so the `import()`
 * call inside survives unrewritten and runs as Node's real dynamic import at runtime.
 */
const dynamicImport = new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<any>;

/**
 * Imports the AppModule from an absolute path. Wraps the path in a `file://` URL — bare absolute
 * paths cannot be passed to dynamic `import()` for ESM resolution, and on Windows raw paths break
 * altogether. Accepts `.js`, `.mjs`, `.cjs`. Returns the named export (default `AppModule`,
 * overridable via the config file's `appModule.export`).
 */
const importAppModuleFromPath = async (absolutePath: string, exportName: string = "AppModule"): Promise<AppModuleInterface> => {
  const url = pathToFileURL(absolutePath).href;
  const loaded = await dynamicImport(url);

  if (!loaded || !loaded[exportName]) {
    throw new Error(
      `[pristine] The file at '${absolutePath}' was loaded but did not export '${exportName}'. ` +
      `Make sure your AppModule file does \`export const ${exportName}: AppModuleInterface = { ... }\`.`
    );
  }

  return loaded[exportName] as AppModuleInterface;
}

/**
 * Asks the user to pick one of the candidates (TTY) or aborts with a clear, actionable error
 * message (non-TTY). The TTY selection is cached to `.pristine/last-app-module` so subsequent
 * invocations skip the prompt.
 */
const resolveAmbiguousCandidates = async (projectRoot: string, candidates: AppModuleCandidate[]): Promise<string> => {
  if (isInteractive() === false) {
    const list = candidates.map(c => `  - ${c.displayPath}`).join("\n");
    throw new Error(
      `[pristine] Found ${candidates.length} AppModule candidates and cannot prompt (no interactive terminal):\n` +
      `${list}\n\n` +
      `Disambiguate by setting \`pristine.appModule.path\` in package.json, e.g.:\n` +
      `  "pristine": { "appModule": { "path": "${candidates[0].displayPath}" } }`
    );
  }

  const selected = await promptForCandidate(candidates);
  if (selected === undefined) {
    throw new Error("[pristine] AppModule selection cancelled.");
  }

  writeCachedAppModulePath(projectRoot, selected);
  return selected;
}

/**
 * Legacy auto-discovery from `node_modules/@pristine-ts/`. Builds a synthetic AppModule by
 * scanning every Pristine package's CJS module exports. Used as a last resort when no
 * AppModule was configured and convention-based discovery turned up nothing in the user's
 * own dist/build directories.
 */
const buildAutoDiscoveredAppModule = async (projectRoot: string): Promise<{appModule: AppModuleInterface; isLoggingModulePresent: boolean}> => {
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
      const module = await dynamicImport(pathToFileURL(moduleFile as string).href);

      for (const key in module) {
        if (key === "LoggingModule") {
          isLoggingModulePresent = true;
        }

        if (key.endsWith("Module")) {
          modules.push(module[key]);
        }
      }
    }
  }

  if (modules.length === 0) {
    // Bare-bones fallback so the bundled bin can still print built-in command output even
    // when invoked outside any project context (e.g. `pristine p:help` on a fresh machine).
    modules.push(CliModule);
  }

  return {
    appModule: {
      keyname: "__auto_generated_app.module__",
      importModules: modules,
      importServices: [],
    },
    isLoggingModulePresent,
  };
}

/**
 * Resolves the consumer's AppModule and produces the default kernel configuration the CLI uses.
 *
 * Discovery cascade (first match wins):
 *   1. `pristine.config.{ts,js,mjs,cjs}`'s `appModule.path` — canonical user config.
 *   2. `pristine.appModule.path` (or deprecated `cjsPath`) in package.json — legacy.
 *   3. `.pristine/last-app-module` — previous TTY selection cached for re-runs.
 *   4. Convention-based scan of dist/, dist/lib/cjs/, dist/lib/esm/, build/, and the project root
 *      for `*.module.{js,mjs,cjs}` files. Single match → use it. Multiple matches → prompt (TTY)
 *      or fail with an actionable error (non-TTY).
 *   5. Legacy auto-discovery from `node_modules/@pristine-ts/`, falling back to a CliModule-only
 *      synthetic AppModule so built-in commands always remain runnable.
 */
export const loadAppModule = async (): Promise<LoadedAppModule> => {
  const projectRoot = process.cwd();
  let appModule: AppModuleInterface;
  let isLoggingModulePresent = false;

  // 1. pristine.config.{ts,js,mjs,cjs} (canonical).
  let resolvedPath: string | undefined;
  let appModuleExportName: string = "AppModule";
  const resolvedConfig = await loadConfig({startDir: projectRoot});
  if (resolvedConfig.config.appModule?.path !== undefined) {
    const configDir = resolvedConfig.configFilePath !== undefined
      ? path.dirname(resolvedConfig.configFilePath)
      : projectRoot;
    resolvedPath = path.resolve(configDir, resolvedConfig.config.appModule.path);
    if (resolvedConfig.config.appModule.export !== undefined) {
      appModuleExportName = resolvedConfig.config.appModule.export;
    }
  }

  // 2. Explicit configuration in package.json (legacy).
  if (resolvedPath === undefined) {
    resolvedPath = getConfiguredAppModulePath(projectRoot);
  }

  // 3. Cached selection from a prior TTY prompt.
  if (resolvedPath === undefined) {
    resolvedPath = readCachedAppModulePath(projectRoot);
  }

  // 4. Convention-based discovery.
  if (resolvedPath === undefined) {
    const candidates = await discoverAppModuleCandidates(projectRoot);
    if (candidates.length === 1) {
      resolvedPath = candidates[0].absolutePath;
    } else if (candidates.length > 1) {
      // If all top-ranked candidates share the same score, they're equally plausible; prompt.
      // If one strictly outranks the rest (e.g. a single `app.module.js` plus other *.module.*
      // files that just happen to export an AppModule symbol), pick the top one without asking.
      const top = candidates[0];
      const tied = candidates.filter(c => c.score === top.score);
      if (tied.length === 1) {
        resolvedPath = top.absolutePath;
      } else {
        resolvedPath = await resolveAmbiguousCandidates(projectRoot, tied);
      }
    }
  }

  if (resolvedPath !== undefined) {
    try {
      appModule = await importAppModuleFromPath(resolvedPath, appModuleExportName);
      isLoggingModulePresent = (appModule.importModules ?? []).find(m => m.keyname === LoggingModuleKeyname) !== undefined;
    } catch (error) {
      // The configured AppModule file is missing or broken. Rather than crashing the bin
      // (which would prevent even built-in commands like `p:config:init` from running, leaving
      // the user with no way to fix their config), warn loudly and fall back to a CliModule-only
      // AppModule. This trades silent breakage for surfaced one — the bin stays operational and
      // the user sees the actual error.
      process.stderr.write(
        `[pristine] Failed to load AppModule from '${resolvedPath}': ${(error as Error).message}\n` +
        `[pristine] Falling back to built-in commands only. Fix your AppModule config and re-run.\n`
      );
      const fallback = await buildAutoDiscoveredAppModule(projectRoot);
      appModule = fallback.appModule;
      isLoggingModulePresent = fallback.isLoggingModulePresent;
    }
  } else {
    // 5. Legacy node_modules scan + CliModule fallback.
    const fallback = await buildAutoDiscoveredAppModule(projectRoot);
    appModule = fallback.appModule;
    isLoggingModulePresent = fallback.isLoggingModulePresent;
  }

  // Load plugins declared in `pristine.config.ts`. They get folded into a wrapper AppModule
  // whose importModules include the user's AppModule + every plugin-contributed module.
  // Plugin loading happens *after* the user's AppModule is resolved so a misconfigured plugin
  // can't prevent the bin from running built-in commands like `p:config:print`.
  let plugins: LoadedPlugin[] = [];
  try {
    plugins = await loadPlugins(resolvedConfig.config, resolvedConfig.configFilePath, projectRoot);
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n`);
    process.stderr.write("[pristine] Continuing without plugins. Fix the plugin config and re-run.\n");
  }

  if (plugins.length > 0) {
    appModule = wrapAppModuleWithPlugins(appModule, plugins);
    // Re-check for LoggingModule presence — a plugin could legitimately contribute it.
    if (isLoggingModulePresent === false) {
      isLoggingModulePresent = (appModule.importModules ?? []).find(m => m.keyname === LoggingModuleKeyname) !== undefined;
    }
  }

  const configuration: { [key: string]: ModuleConfigurationValue } = {};

  if (isLoggingModulePresent) {
    configuration[LoggingModuleKeyname + ".consoleLoggerOutputMode"] = OutputModeEnum.Simple;
    configuration[LoggingModuleKeyname + ".logSeverityLevelConfiguration"] = SeverityEnum.Error;
  }

  // User-supplied kernelConfiguration overrides the CLI defaults above. This is how a consumer
  // can, for example, opt back into JSON logging or raise verbosity for the CLI specifically
  // without touching their AppModule's configuration definitions.
  if (resolvedConfig.config.kernelConfiguration !== undefined) {
    Object.assign(configuration, resolvedConfig.config.kernelConfiguration);
  }

  return {appModule, configuration, isLoggingModulePresent, plugins};
}
