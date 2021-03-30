import {ModuleInterface} from "@pristine-ts/common";
import {ConfigurationDefinition} from "./configurations/configuration.definition";


export * from "./configurations/configurations";
export * from "./enums/enums";
export * from "./event-parsers/event-parsers";
export * from "./event-payloads/event-payloads";
export * from "./interfaces/interfaces";
export * from "./models/models";

export const AwsModule: ModuleInterface = {
    keyname: "pristine.aws",
    configurationDefinition: ConfigurationDefinition,
    importServices: [],
    importModules: [],
    providerRegistrations: [
    ]
}
