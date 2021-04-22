import {ModuleInterface} from "@pristine-ts/common";
import {ConfigurationDefinition} from "./configurations/configuration.definition";
import {NetworkingModule} from "@pristine-ts/networking";

export * from "./configurations/configurations";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./managers/managers";

export const SecurityModule: ModuleInterface = {
    keyname: "pristine.security",
    configurationDefinition: ConfigurationDefinition,
    importServices: [],
    importModules: [
        NetworkingModule,
    ],
    providerRegistrations: []
}
