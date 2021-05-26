import {AppModule} from "./app.module";
import {AwsModule, AwsModuleKeyname, RequestMapper, ResponseMapper} from "@pristine-ts/aws";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {Kernel} from "@pristine-ts/core";
import {LoggingModuleKeyname} from "@pristine-ts/logging";
import {Context} from "vm";

let cachedKernel;

export const bootstrapKernel = async () => {
    const kernel = new Kernel();

    await kernel.init(AppModule, {
        [AwsModuleKeyname + ".region"] : await (new EnvironmentVariableResolver("REGION").resolve()),
        [LoggingModuleKeyname + ".numberOfStackedLogs"] : await (new EnvironmentVariableResolver("NUMBER_OF_STACKED_LOGS").resolve()),
        [LoggingModuleKeyname + ".consoleLoggerActivated"] : await (new EnvironmentVariableResolver("CONSOLE_LOGGER_ACTIVATED").resolve()),
    });

    return kernel;
};

export const handler = async (event: any, context: Context) => {
    cachedKernel = cachedKernel ?? await bootstrapKernel();

    const apiGatewayRequestMapper = cachedKernel.container.resolve(RequestMapper);
    const apiGatewayResponseMapper = cachedKernel.container.resolve(ResponseMapper);

    return apiGatewayResponseMapper.reverseMap(await cachedKernel.handleRequest(apiGatewayRequestMapper.map(event)));
};
