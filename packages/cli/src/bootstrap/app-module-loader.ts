import fs from "fs";
import {AppModuleInterface} from "@pristine-ts/common";
import {ModuleConfigurationValue} from "@pristine-ts/configuration";
import {LoggingModuleKeyname, OutputModeEnum, SeverityEnum} from "@pristine-ts/logging";
import {DirectoryListResultEnum, DirectoryManager, FileManager, MatchTypeEnum, TypesEnum} from "@pristine-ts/file";

const getLocalAppModuleCJSPath = async (): Promise<string | undefined> => {
  return new Promise<string | undefined>((resolve) => {
    const packageJson = process.cwd() + "/package.json";

    fs.stat(packageJson, async (err, stats) => {
      if (err || stats.isFile() === false) {
        return resolve(undefined);
      }

      const {pristine} = await import(packageJson);

      if (pristine === undefined || pristine.appModule === undefined || pristine.appModule.cjsPath === undefined) {
        return resolve(undefined);
      }

      return resolve(process.cwd() + "/" + pristine.appModule.cjsPath);
    })
  })
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
    const directoryManager = new DirectoryManager(new FileManager());
    const moduleFiles = await directoryManager.list(process.cwd() + "/node_modules/@pristine-ts", {
      matchType: MatchTypeEnum.Path,
      match: /.*\/cjs\/.*\.module\.js$/,
      types: TypesEnum.File,
      resultType: DirectoryListResultEnum.FilePath,
      recurse: true,
    });

    const modules = [];
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
