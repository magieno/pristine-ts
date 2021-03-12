import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {ConfigurationDefinition} from "./configurations/configuration.definition";
import {NetworkingModule} from "@pristine-ts/networking";
import {JwtManager} from "./managers/jwt.manager";
import {JwtManagerInterface} from "./interfaces/jwt-manager.interface";
import {JwtPayloadParameterDecoratorResolver} from "./resolvers/jwt-payload-parameter-decorator.resolver";

export * from "./configurations/configurations";
export * from "./decorators/decorators";
export * from "./errors/errors";
export * from "./guards/guards";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./resolvers/resolvers";

export const JwtModule: ModuleInterface = {
    keyname: "pristine.jwt",
    configurationDefinition: ConfigurationDefinition,
    importServices: [],
    importModules: [
        NetworkingModule,
    ],
    providerRegistrations: [{
        token: "JwtManagerInterface",
        useToken: JwtManager,
    }]
}
