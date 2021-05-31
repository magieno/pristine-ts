import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {AwsCognitoModuleKeyname} from "./aws-cognito.module.keyname";
import {HttpModule} from "@pristine-ts/http";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";

export * from "./authenticators/authenticators";
export * from "./guards/guards";
export * from "./interfaces/interfaces";

export const AwsCognitoModule: ModuleInterface = {
    keyname: AwsCognitoModuleKeyname,
    configurationDefinitions: [
        {
            parameterName: AwsCognitoModuleKeyname + ".region",
            isRequired: false,
            defaultValue: "us-east-1",
            defaultResolvers: [
                new EnvironmentVariableResolver("AWS_REGION"),
            ]
        },
        {
            parameterName: AwsCognitoModuleKeyname + ".poolId",
            isRequired: true,
            defaultResolvers: [
                new EnvironmentVariableResolver("PRISTINE_AWS_COGNITO_POOL_ID"),
            ]
        }
    ],
    importModules: [
        HttpModule,
    ],

    /**
     * This property allows you to custom register specific services. For example, you can assign a tag or use a factory
     * to instantiate a specific class.
     */
    providerRegistrations: [
    ],
}
