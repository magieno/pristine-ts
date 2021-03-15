import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {SentryLogger} from "./loggers/sentry.logger";
import {ConfigurationDefinition} from "./configurations/configuration.definition";

export * from "./configurations/configurations";
export * from "./interfaces/interfaces";
export * from "./loggers/loggers";

export const SentryModule: ModuleInterface = {
    keyname: "pristine.sentry",
    configurationDefinition: ConfigurationDefinition,
    importServices: [],
    importModules: [],
    providerRegistrations: [
        {
            token: ServiceDefinitionTagEnum.Logger,
            useToken: SentryLogger,
        }
    ]
}
