import {ModuleInterface} from "@pristine-ts/common";
import {ConfigurationDefinition} from "./configurations/configuration.definition";
import {LogHandler} from "./handlers/log.handler";
import {ConsoleLogger} from "./loggers/console.logger";
import {FileLogger} from "./loggers/file.logger";

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
    importServices: [
        LogHandler,

        ConsoleLogger,
        FileLogger,
    ],
    importModules: [],
    providerRegistrations: [
    ]
}
