import {ModuleInterface} from "@pristine-ts/common";
import {ConsoleWriter} from "./writers/console.writer";
import {ConfigurationDefinition} from "./configurations/configuration.definition";

export * from "./configurations/configurations";
export * from "./enums/enums";
export * from "./handlers/handlers";
export * from "./interfaces/interfaces";
export * from "./models/models";
export * from "./writers/writers";

export const LoggingModule: ModuleInterface = {
    keyname: "pristine.logging",
    configurationDefinition: ConfigurationDefinition,
    importServices: [],
    importModules: [],
    providerRegistrations: [
        {
            token: "writer",
            useToken: ConsoleWriter,
        }
    ]
}
