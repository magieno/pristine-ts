import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {SentryLogger} from "./loggers/sentry.logger";
import {ConfigurationDefinition} from "./configurations/configuration.definition";

export * from "./configurations/configurations";
export * from "./interfaces/interfaces";
export * from "./loggers/loggers";

export const TelemetryModule: ModuleInterface = {
    keyname: "pristine.telemetry",
    configurationDefinition: ConfigurationDefinition,
    importServices: [],
    importModules: [],
    providerRegistrations: [
    ]
}
