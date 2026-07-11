# Changelog — @pristine-ts/auth0

## 4.0.3

- **Centrally configurable expected audience.** The audience (`aud` claim) an Auth0 access token must contain can now
  be configured once at the module level via the `pristine.auth0.expected.audience` configuration key (environment
  variable `PRISTINE_AUTH0_EXPECTED_AUDIENCE`), instead of having to be passed as an
  `@authenticator(Auth0Authenticator, {expectedAudience})` option on every controller. This makes it practical to
  enforce audience validation everywhere (per RFC 9068 a resource server should validate `aud`) rather than relying on
  each route opting in.

  Resolution precedence: a per-decorator `expectedAudience` option wins; otherwise the configured audience is used; if
  neither is set the `aud` claim is not validated. The feature is **opt-in and fully backward compatible** — with no
  option and no configuration the behavior is exactly as before (no audience check). The new configuration key is
  **not** required: it resolves to the empty-string "unset" sentinel when absent, so adding the module never breaks
  boot and no default audience is invented.

- **`expectedAudience` now also accepts an array.** In addition to a single `string`, the decorator option accepts
  `string[]`; the check then passes when the token's `aud` intersects the expected set. The single-string path is
  unchanged.

- **Exact audience matching (latent bug fix).** Audience membership is now an exact match. The previous code used
  `claim.aud.includes(expectedAudience)`, which — when a token's `aud` is a single string rather than an array —
  performed a *substring* match (e.g. `"pristine-ts.com"` would match a token audience of `"https://pristine-ts.com"`).
  Both a string and an array `aud` are now normalized to a list before an exact-membership check.

- Added a typed `Auth0AuthenticatorOptionsInterface` for the `@authenticator` options (`expectedAudience` /
  `expectedScopes`, previously untyped `any`) and an `Auth0ConfigurationKeys` constant for the package's
  configuration keys.

- **`@authenticator(Auth0Authenticator, …)` options are now type-checked.** `Auth0Authenticator` declares a phantom
  `static __options` marker that the (now generic) `@authenticator` decorator infers, so a mistyped or wrong-typed
  option — e.g. `expectedScope` instead of `expectedScopes`, or a non-string audience — is a compile error at the
  call site. Requires `@pristine-ts/security` >= 4.0.3; authenticators without the marker are unaffected.
