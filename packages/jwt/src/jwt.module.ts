import {ModuleInterface} from "@pristine-ts/common";
import {ConfigurationDefinition} from "./configurations/configuration.definition";
import {NetworkingModule} from "@pristine-ts/networking";

export * from "./configurations/configurations";
export * from "./decorators/decorators";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./resolvers/resolvers";

export const JwtModule: ModuleInterface = {
    keyname: "pristine.jwt",
    configurationDefinition: ConfigurationDefinition,
    importServices: [],
    importModules: [
        NetworkingModule,
    ]
}