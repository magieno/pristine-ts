import {AppModuleInterface} from "@pristine-ts/common";
import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {CliModule} from "@pristine/cli";
import {SampleCommand} from "./sample.command";

const module: AppModuleInterface = {
    keyname: "app.cli.test",

    importModules: [
        CliModule,
    ],
    providerRegistrations: [
        SampleCommand,
    ],
    configurationDefinitions: [
    ],
    importServices: [],
};

const bootstrap = async () => {
    const kernel = new Kernel();
    await kernel.start(module);

    await kernel.handle(process.argv, {keyname: ExecutionContextKeynameEnum.Cli, context: null})
}

bootstrap();
