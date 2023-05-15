import {AppModuleInterface} from "@pristine-ts/common";
import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {CliModule} from "@pristine-ts/cli";
import {SampleCommand} from "./sample.command";

console.log("Starting the CLI")

const bootstrap = async () => {
    const module: AppModuleInterface = {
        keyname: "app.cli.test",

        importModules: [
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

    const kernel = new Kernel();
    await kernel.start(module);

    await kernel.handle(process.argv, {keyname: ExecutionContextKeynameEnum.Cli, context: null})
}

bootstrap();