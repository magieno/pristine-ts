import {ModuleInterface} from "@pristine-ts/common";
import {Auth0ModuleKeyname} from "./auth0.module.keyname";
import {Auth0ConfigurationKeys} from "./auth0.configuration-keys";
import {HttpModule} from "@pristine-ts/http";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {LoggingModule} from "@pristine-ts/logging";

export * from "./authenticators/authenticators";
export * from "./interfaces/interfaces";

export * from "./auth0.module.keyname";
export * from "./auth0.configuration-keys";

export const Auth0Module: ModuleInterface = {
  keyname: Auth0ModuleKeyname,
  configurationDefinitions: [
    /**
     * The auth0 issuer domain (without the http://),
     * used to retrieve the public key and validate the JWTs.
     */
    {
      parameterName: Auth0ConfigurationKeys.IssuerDomain,
      isRequired: true,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_AUTH0_ISSUER_DOMAIN"),
      ]
    },
    /**
     * The audience (`aud` claim) that access tokens are expected to contain. This makes
     * audience validation configurable centrally, so it no longer has to be passed as a
     * per-controller `@authenticator(Auth0Authenticator, {expectedAudience})` option.
     *
     * It is NOT required: when neither this config nor the
     * `PRISTINE_AUTH0_EXPECTED_AUDIENCE` environment variable is set it resolves to the
     * empty string `""`, which the authenticator treats as "no audience configured" and
     * skips the check — preserving the previous opt-in behavior. A per-decorator
     * `expectedAudience` option still takes precedence when both are provided.
     *
     * (The configuration system requires a `defaultValue` for a non-required parameter
     * and cannot register `undefined`, so `""` is the "unset" sentinel here rather than a
     * real default audience.)
     */
    {
      parameterName: Auth0ConfigurationKeys.ExpectedAudience,
      isRequired: false,
      defaultValue: "",
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_AUTH0_EXPECTED_AUDIENCE"),
      ]
    },
  ],
  importModules: [
    LoggingModule,
    HttpModule
  ],
}

