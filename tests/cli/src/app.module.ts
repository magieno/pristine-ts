import {AppModuleInterface, CommonModule} from "@pristine-ts/common";
import {CliModule} from "@pristine-ts/cli";
import {SampleCommand} from "./sample.command";
import {CoreModule} from "@pristine-ts/core";

export const AppModule: AppModuleInterface = {
    keyname: "app.cli.test",

    importModules: [
        CoreModule,
        CommonModule,
        CliModule,
    ],
    providerRegistrations: [
    ],
    configurationDefinitions: [
    ],
    importServices: [
        SampleCommand,
    ],
};