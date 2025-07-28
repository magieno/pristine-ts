import {ModuleInterface} from "@pristine-ts/common";
import {Auth0ModuleKeyname} from "./auth0.module.keyname";
import {HttpModule} from "@pristine-ts/http";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {LoggingModule} from "@pristine-ts/logging";

export * from "./authenticators/authenticators";
export * from "./interfaces/interfaces";

export * from "./auth0.module.keyname";

export const Auth0Module: ModuleInterface = {
  keyname: Auth0ModuleKeyname,
  configurationDefinitions: [
    /**
     * The auth0 issuer domain (without the http://),
     * used to retrieve the public key and validate the JWTs.
     */
    {
      parameterName: Auth0ModuleKeyname + ".issuer.domain",
      isRequired: true,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_AUTH0_ISSUER_DOMAIN"),
      ]
    },
  ],
  importModules: [
    LoggingModule,
    HttpModule
  ],
}

