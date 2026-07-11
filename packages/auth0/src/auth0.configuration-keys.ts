/**
 * Typed configuration keys for `@pristine-ts/auth0`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {Auth0ConfigurationKeys} from "@pristine-ts/auth0";
 *
 * constructor(@injectConfig(Auth0ConfigurationKeys.ExpectedAudience) value: string) {}
 * ```
 *
 * Note: `ExpectedAudience` is optional. When neither the config nor the
 * `PRISTINE_AUTH0_EXPECTED_AUDIENCE` environment variable is set it resolves to the empty
 * string `""` (the configuration system cannot register `undefined`), which the
 * authenticator treats as "no audience configured".
 */
export const Auth0ConfigurationKeys = {
  IssuerDomain: "pristine.auth0.issuer.domain",
  ExpectedAudience: "pristine.auth0.expected.audience",
} as const;
