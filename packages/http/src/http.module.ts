import {ModuleInterface} from "@pristine-ts/common";
import {HttpModuleKeyname} from "./http.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";
import {BooleanResolver, EnvironmentVariableResolver, NumberResolver} from "@pristine-ts/configuration";
import {CliModule} from "@pristine-ts/cli";

export * from "./http.module.keyname";
export * from "./commands/commands";
export * from "./clients/clients";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interceptors/interceptors"
export * from "./interfaces/interfaces"
export * from "./options/options";
export * from "./servers/servers";
export * from "./utils/utils";
export * from "./wrappers/wrappers";

export const HttpModule: ModuleInterface = {
    keyname: HttpModuleKeyname,
    importModules: [LoggingModule, CliModule],
    configurationDefinitions: [
        {
            parameterName: `${HttpModuleKeyname}.logging-enabled`,
            defaultValue: true,
            isRequired: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_HTTP_LOGGING")),
            ]
        },
        {
            parameterName: `${HttpModuleKeyname}.http-server.file.address`,
            defaultValue: "127.0.0.1",
            isRequired: false,
            defaultResolvers: [
                new EnvironmentVariableResolver("PRISTINE_HTTP_SERVER_FILE_ADDRESS"),
            ]
        },
        {
            parameterName: `${HttpModuleKeyname}.http-server.file.port`,
            defaultValue: 9000,
            isRequired: false,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_HTTP_SERVER_FILE_PORT")),
            ]
        },
    ],
}
