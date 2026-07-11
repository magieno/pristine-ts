/**
 * The options that can be passed to the `Auth0Authenticator` through the `@authenticator`
 * decorator, i.e. `@authenticator(Auth0Authenticator, options)`. These end up on the
 * authenticator context as `context.options`.
 *
 * Both fields are optional. A field left unset means "do not enforce this check" — the
 * audience check additionally falls back to the module-level
 * `pristine.auth0.expected.audience` configuration when `expectedAudience` is omitted.
 */
export interface Auth0AuthenticatorOptionsInterface {
  /**
   * The audience(s) the token's `aud` claim must contain. A single string must match one
   * of the token's audiences exactly; an array matches when the token's `aud` intersects
   * the set. When omitted, the module-level `pristine.auth0.expected.audience`
   * configuration is used instead (per-decorator option wins when both are set).
   */
  expectedAudience?: string | string[];

  /**
   * The scope(s) the token's `scope` claim must contain. A single string requires that
   * one scope; an array requires all of them.
   */
  expectedScopes?: string | string[];
}
