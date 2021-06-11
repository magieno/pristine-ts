import {ModuleInterface} from "@pristine-ts/common";
import {Auth0ModuleKeyname} from "./auth0.module.keyname";
import {HttpModule} from "@pristine-ts/http";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";

export * from "./authenticators/authenticators";
export * from "./interfaces/interfaces";

export * from "./auth0.module.keyname";

export const Auth0Module: ModuleInterface = {
    keyname: Auth0ModuleKeyname,
    configurationDefinitions: [
        {
            parameterName: Auth0ModuleKeyname + ".domain",
            isRequired: true,
            defaultResolvers: [
                new EnvironmentVariableResolver("AUTH0_DOMAIN"),
            ]
        },
    ],
    importModules: [HttpModule],
}

