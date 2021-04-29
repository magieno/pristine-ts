import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {NetworkingModule} from "@pristine-ts/networking";
import {JwtManager} from "./managers/jwt.manager";
import {JwtManagerInterface} from "./interfaces/jwt-manager.interface";
import {JwtPayloadParameterDecoratorResolver} from "./resolvers/jwt-payload-parameter-decorator.resolver";

export * from "./decorators/decorators";
export * from "./errors/errors";
export * from "./guards/guards";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./resolvers/resolvers";

export const JwtModule: ModuleInterface = {
    keyname: "pristine.jwt",
    configurationDefinitions: [
        {
            parameterName: "pristine.jwt.algorithm",
            isRequired: false,
            defaultValue: "HS256",
        },
        {
            parameterName: "pristine.jwt.publicKey",
            isRequired: true,
        },
        {
            parameterName: "pristine.jwt.privateKey",
            isRequired: false,
            defaultValue: "",
        },
        {
            parameterName: "pristine.jwt.passphrase",
            isRequired: false,
            defaultValue: "",
        },
    ],
    importServices: [],
    importModules: [
        NetworkingModule,
    ],
    providerRegistrations: [{
        token: "JwtManagerInterface",
        useToken: JwtManager,
    }]
}
