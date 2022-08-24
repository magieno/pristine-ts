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
        /**
         * The AWS region in which Cognito is setup.
         */
        {
            parameterName: AwsCognitoModuleKeyname + ".region",
            isRequired: false,
            defaultValue: "us-east-1",
            defaultResolvers: [
                new EnvironmentVariableResolver("AWS_REGION"),
            ]
        },
        /**
         * The pool id of the Cognito user pool.
         */
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
}
