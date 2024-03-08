import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import fs from "fs";
import {LoggingModuleKeyname, OutputModeEnum, SeverityEnum} from "@pristine-ts/logging";
import {DirectoryManager, MatchTypeEnum} from "@pristine-ts/file";

const getLocalAppModuleCJSPath = async (): Promise<string | undefined> => {
    return new Promise<string | undefined>((resolve, reject) => {
        const packageJson = process.cwd() + "/package.json";

        fs.stat(packageJson, async (err, stats) => {
            if(err || stats.isFile() === false) {
                const message = "Cannot find the package.json at '" + packageJson + "'. Make sure that you execute this script directly from the parent of your 'package.json'"
                console.error(message);
                console.error(err);
                return resolve(undefined);
            }

            const {pristine} = await import(packageJson);

            if(pristine === undefined) {
                const message = "There needs to be a section 'pristine' in your package.json file located at: '" + packageJson + "'";
                console.error(message);
                return resolve(undefined);
            }

            if(pristine.appModule === undefined) {
                const message = "There should be a section 'appModule' under 'pristine' in your package.json file located at: '" + packageJson + "'"
                console.error(message);
                return resolve(undefined);
            }
            if(pristine.appModule.cjsPath === undefined) {
                const message = "There should be a property 'cjsPath' under 'pristine.appModule' in your package.json file located at: '" + packageJson + "'"
                console.error(message);
                return resolve(undefined);
            }

            return resolve( process.cwd() + "/" + pristine.appModule.cjsPath);
        })
    })
}



const bootstrap = async () => {
    const cjsPath = await getLocalAppModuleCJSPath();

    if(cjsPath === undefined) {
        // Try the automatic Module creation.

        // Loop over the `node_modules/@pristine-ts/*/dist/lib/cjs/*.module.js` folders and find all the module files that are loaded.
        const directoryManager = new DirectoryManager();
        const directories = await directoryManager.list(process.cwd() + "/node_modules/@pristine-ts", {
            matchType: MatchTypeEnum.Filename,
            match: "*.module.js",
        });

        return;
    }

    const localAppModule = await import(cjsPath);

    const kernel = new Kernel();
    await kernel.start(localAppModule.AppModule, {
        [LoggingModuleKeyname + ".consoleLoggerOutputMode"]: OutputModeEnum.Simple,
        [LoggingModuleKeyname + ".logSeverityLevelConfiguration"]: SeverityEnum.Error,
    });

    await kernel.handle(process.argv, {keyname: ExecutionContextKeynameEnum.Cli, context: null})
}

bootstrap();