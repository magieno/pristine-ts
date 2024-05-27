import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import fs from "fs";
import {LoggingModuleKeyname, OutputModeEnum, SeverityEnum} from "@pristine-ts/logging";
import {DirectoryListResultEnum, DirectoryManager, MatchTypeEnum, TypesEnum} from "@pristine-ts/file";
import {AppModuleInterface} from "@pristine-ts/common";
import {ModuleConfigurationValue} from "@pristine-ts/configuration";

const getLocalAppModuleCJSPath = async (): Promise<string | undefined> => {
    return new Promise<string | undefined>((resolve, reject) => {
        const packageJson = process.cwd() + "/package.json";

        fs.stat(packageJson, async (err, stats) => {
            if (err || stats.isFile() === false) {
                const message = "Cannot find the package.json at '" + packageJson + "'. Make sure that you execute this script directly from the parent of your 'package.json'"
                //console.error(message);
                //console.error(err);
                return resolve(undefined);
            }

            const {pristine} = await import(packageJson);

            if (pristine === undefined) {
                const message = "There needs to be a section 'pristine' in your package.json file located at: '" + packageJson + "'";
                //console.error(message);
                return resolve(undefined);
            }

            if (pristine.appModule === undefined) {
                const message = "There should be a section 'appModule' under 'pristine' in your package.json file located at: '" + packageJson + "'"
                //console.error(message);
                return resolve(undefined);
            }
            if (pristine.appModule.cjsPath === undefined) {
                const message = "There should be a property 'cjsPath' under 'pristine.appModule' in your package.json file located at: '" + packageJson + "'"
                //console.error(message);
                return resolve(undefined);
            }

            return resolve(process.cwd() + "/" + pristine.appModule.cjsPath);
        })
    })
}

export const startKernel = async(module: AppModuleInterface, configurationOverrides: { [key: string]: ModuleConfigurationValue } = {
    [LoggingModuleKeyname + ".consoleLoggerOutputMode"]: OutputModeEnum.Simple,
    [LoggingModuleKeyname + ".logSeverityLevelConfiguration"] :SeverityEnum.Error,
}) => {
    const kernel = new Kernel();
    await kernel.start(module, configurationOverrides);

    await kernel.handle(process.argv, {keyname: ExecutionContextKeynameEnum.Cli, context: null})
}
 const bootstrap = async () => {
    let localAppModule: AppModuleInterface;
    let isLoggingModulePresent = false;

    const cjsPath = await getLocalAppModuleCJSPath();

    if (cjsPath !== undefined) {
        localAppModule = (await import(cjsPath)).AppModule;

        isLoggingModulePresent = localAppModule.importModules.find((module) => module.keyname === LoggingModuleKeyname) !== undefined;
    } else { // Try the automatic Module creation.
        // Loop over the `node_modules/@pristine-ts/*/dist/lib/cjs/*.module.js` folders and find all the module files that are loaded.
        const directoryManager = new DirectoryManager();
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
                if(key === "LoggingModule") {
                    isLoggingModulePresent = true;
                }

                if (key.endsWith("Module")) {
                    modules.push(module[key]);
                }
            }
        }

        localAppModule = {
            keyname: "__auto_generated_app.module__",
            importModules: modules,
            importServices: [],
        }
    }

    const configuration: { [key: string]: ModuleConfigurationValue } = {};

    if(isLoggingModulePresent) {
        configuration[LoggingModuleKeyname + ".consoleLoggerOutputMode"] = OutputModeEnum.Simple;
        configuration[LoggingModuleKeyname + ".logSeverityLevelConfiguration"] = SeverityEnum.Error;
    }

    await startKernel(localAppModule, configuration);
}

bootstrap();
