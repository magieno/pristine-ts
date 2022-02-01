import {AppModuleInterface, ModuleInterface} from "@pristine-ts/common";
import {SecurityModule} from "@pristine-ts/security";
import {NetworkingModule} from "@pristine-ts/networking";
import {LoggingModule} from "@pristine-ts/logging";
import {CoreModule} from "@pristine-ts/core";
import {AwsCognitoModule} from "@pristine-ts/aws-cognito";
import {AwsModule} from "@pristine-ts/aws";
import {DemoController} from "./controllers/demo.controller";

export const AppModule: AppModuleInterface = {
    importServices: [
        DemoController,
    ],
    importModules: [
        AwsModule,
        AwsCognitoModule,
        CoreModule,
        LoggingModule,
        NetworkingModule,
        SecurityModule,
    ],
    keyname: "demo.lambda",
};
