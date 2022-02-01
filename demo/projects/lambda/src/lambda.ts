import {AppModule} from "./app.module";
import {AwsModuleKeyname} from "@pristine-ts/aws";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {LoggingModuleKeyname} from "@pristine-ts/logging";
import {Context} from "vm";

let cachedKernel: Kernel;

export const bootstrapKernel = async () => {
    const kernel = new Kernel();

    await kernel.start(AppModule, {
        [AwsModuleKeyname + ".region"] : await (new EnvironmentVariableResolver("REGION").resolve()),
        [LoggingModuleKeyname + ".numberOfStackedLogs"] : await (new EnvironmentVariableResolver("NUMBER_OF_STACKED_LOGS").resolve()),
        [LoggingModuleKeyname + ".consoleLoggerActivated"] : await (new EnvironmentVariableResolver("CONSOLE_LOGGER_ACTIVATED").resolve()),
    });

    return kernel;
};

export const handler = async (event: any, context: Context) => {
    cachedKernel = cachedKernel ?? await bootstrapKernel();
    await cachedKernel.handle(event, {keyname: ExecutionContextKeynameEnum.AwsLambda, context});
};
