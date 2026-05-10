import fs from "fs";
import {AppModuleInterface} from "@pristine-ts/common";
import {ModuleConfigurationValue} from "@pristine-ts/configuration";
import {LoggingModuleKeyname, OutputModeEnum, SeverityEnum} from "@pristine-ts/logging";
import {DirectoryListResultEnum, DirectoryManager, FileManager, MatchTypeEnum, TypesEnum} from "@pristine-ts/file";
import {CliModule} from "../cli.module";

const getLocalAppModuleCJSPath = async (): Promise<string | undefined> => {
  const packageJson = process.cwd() + "/package.json";

  if (fs.existsSync(packageJson) === false) {
    return undefined;
  }

  // fs.readFile + JSON.parse rather than `await import(packageJson)` — modern Node requires
  // `with: { type: "json" }` import attributes for JSON imports, and silently failing here
  // would mask broken AppModule configuration.
  let parsed: any;
  try {
    parsed = JSON.parse(fs.readFileSync(packageJson, "utf8"));
  } catch {
    return undefined;
  }

  const pristine = parsed?.pristine;
  if (pristine === undefined || pristine.appModule === undefined || pristine.appModule.cjsPath === undefined) {
    return undefined;
  }

  return process.cwd() + "/" + pristine.appModule.cjsPath;
}

export interface LoadedAppModule {
  appModule: AppModuleInterface;
  configuration: { [key: string]: ModuleConfigurationValue };
  isLoggingModulePresent: boolean;
}

/**
 * Resolves the consumer's AppModule (either from `pristine.appModule.cjsPath` in package.json or by
 * auto-discovering Pristine modules under node_modules) and produces the default configuration the CLI
 * uses when starting a kernel. Extracted from `bootstrap()` so commands like `p:verify` can build a
 * fresh kernel without depending on the running CLI's kernel instance.
 */
export const loadAppModule = async (): Promise<LoadedAppModule> => {
  let appModule: AppModuleInterface;
  let isLoggingModulePresent = false;

  const cjsPath = await getLocalAppModuleCJSPath();

  if (cjsPath !== undefined) {
    appModule = (await import(cjsPath)).AppModule;
    isLoggingModulePresent = appModule.importModules.find((module) => module.keyname === LoggingModuleKeyname) !== undefined;
  } else {
    // No package.json pointer to an AppModule. Try auto-discovering Pristine modules from
    // node_modules/@pristine-ts/. When that directory doesn't exist (the bin was invoked
    // outside any project — e.g. the bundled bin running on a fresh machine for `pristine
    // p:help`), fall back to a synthetic AppModule that just imports CliModule so the
    // built-in commands remain available without any user setup.
    const pristineNodeModulesPath = process.cwd() + "/node_modules/@pristine-ts";
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
        const module = await import(moduleFile as string);

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
      // Bare-bones fallback so built-in commands still run when there's no project context.
      modules.push(CliModule);
    }

    appModule = {
      keyname: "__auto_generated_app.module__",
      importModules: modules,
      importServices: [],
    }
  }

  const configuration: { [key: string]: ModuleConfigurationValue } = {};

  if (isLoggingModulePresent) {
    configuration[LoggingModuleKeyname + ".consoleLoggerOutputMode"] = OutputModeEnum.Simple;
    configuration[LoggingModuleKeyname + ".logSeverityLevelConfiguration"] = SeverityEnum.Error;
  }

  return {appModule, configuration, isLoggingModulePresent};
}
