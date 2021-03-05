import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {SentryWriter} from "./writers/sentry.writer";
import {ConfigurationDefinition} from "./configurations/configuration.definition";

export * from "./configurations/configurations";
export * from "./interfaces/interfaces";
export * from "./writers/writers";

export const SentryModule: ModuleInterface = {
    keyname: "pristine.sentry",
    configurationDefinition: ConfigurationDefinition,
    importServices: [],
    importModules: [],
    providerRegistrations: [
        {
            token: ServiceDefinitionTagEnum.Writer,
            useToken: SentryWriter,
        }
    ]
}
