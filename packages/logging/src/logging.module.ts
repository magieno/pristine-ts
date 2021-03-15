import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {ConsoleLogger} from "./loggers/console.logger";
import {ConfigurationDefinition} from "./configurations/configuration.definition";

export * from "./configurations/configurations";
export * from "./enums/enums";
export * from "./handlers/handlers";
export * from "./interfaces/interfaces";
export * from "./models/models";
export * from "./loggers/loggers";
export * from "./utils/utils";

export const LoggingModule: ModuleInterface = {
    keyname: "pristine.logging",
    configurationDefinition: ConfigurationDefinition,
    importServices: [],
    importModules: [],
    providerRegistrations: [
        {
            token: ServiceDefinitionTagEnum.Logger,
            useToken: ConsoleLogger,
        }
    ]
}
