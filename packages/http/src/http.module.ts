import {ModuleInterface} from "@pristine-ts/common";
import {HttpModuleKeyname} from "./http.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";
import {BooleanResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";

export * from "./clients/clients";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interceptors/interceptors"
export * from "./interfaces/interfaces"
export * from "./options/options";
export * from "./utils/utils";
export * from "./wrappers/wrappers";

export const HttpModule: ModuleInterface = {
    keyname: HttpModuleKeyname,
    importModules: [LoggingModule],
    configurationDefinitions: [
        {
            parameterName: "pristine.http.logging-enabled",
            defaultValue: true,
            isRequired: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_HTTP_LOGGING")),
            ]
        }
    ],
}
