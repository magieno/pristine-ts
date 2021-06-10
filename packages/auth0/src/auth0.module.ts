import {ModuleInterface} from "@pristine-ts/common";
import {Auth0ModuleKeyname} from "./auth0.module.keyname";
import {HttpModule} from "@pristine-ts/http";


export * from "./auth0.module.keyname";

export const Auth0Module: ModuleInterface = {
    keyname: Auth0ModuleKeyname,
    configurationDefinitions: [
    ],
    importModules: [HttpModule],
}

