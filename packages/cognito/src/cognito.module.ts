import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {CognitoModuleKeyname} from "./cognito.module.keyname";

export * from "./authenticators/authenticators";
export * from "./clients/clients";
export * from "./decorators/decorators";
export * from "./guards/guards";
export * from "./interfaces/interfaces";

export const CognitoModule: ModuleInterface = {
    keyname: CognitoModuleKeyname,
    configurationDefinitions: [
        {
            parameterName: CognitoModuleKeyname + ".region",
            isRequired: false,
            defaultValue: "us-east-1",
        },
        {
            parameterName: CognitoModuleKeyname + ".poolId",
            isRequired: true,
        }
    ],

    importServices: [],

    /**
     * This property allows you to custom register specific services. For example, you can assign a tag or use a factory
     * to instantiate a specific class.
     */
    providerRegistrations: [
    ],
}
