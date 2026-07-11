Auth0 Module
------------

[Auth0](https://auth0.com) is service that makes it easy to implement Authentication into your backend services. In
order to facilitate integration with Auth0, we have created an official Pristine module.

As you will see in the next chapters, you can use authenticators to ensure that before reaching your method in your
controller, you are properly authenticated.

With the Auth0 module, we have simplified this process for you.

### 1- Import the Auth0Module

```
export const AppModule: AppModuleInterface = {
    importServices: [
    ],
    importModules: [
     CoreModule,
     Auth0Module,
    ],
    keyname: "my_namespace.app",
}
```

### 2- Put in the configuration the value for your Auth0 domain

By default, you can define the environment variable: `PRISTINE_AUTH0_ISSUER_DOMAIN`

(This maps to the configuration key `pristine.auth0.issuer.domain`.)

That's it, if you make an HTTP Request to a Pristine microservice and you pass a valid JWT as a HTTP Header:

```
Authorization: Bearer YOUR_JWT_HERE
```

### 3- (Optional) Validate the token audience

Per [RFC 9068](https://www.rfc-editor.org/rfc/rfc9068), a resource server should validate that an access token's
`aud` (audience) claim is intended for it. You can enable this check **centrally**, so it no longer has to be passed
as an option on every controller:

| Configuration key                  | Environment variable               | Required |
|------------------------------------|------------------------------------|----------|
| `pristine.auth0.expected.audience` | `PRISTINE_AUTH0_EXPECTED_AUDIENCE` | No       |

```ts
// e.g. via kernel.start(), pristine.config.ts, or the environment variable above:
await kernel.start(AppModule, {
    "pristine.auth0.expected.audience": "https://api.my-service.com",
});
```

When set, every request authenticated with the `Auth0Authenticator` must present a token whose `aud` claim contains
that audience. Matching is **exact**: a single-string `aud` must equal the expected value (no substring match), and an
array `aud` must contain it.

**This is opt-in and 100% backward compatible.** If neither the configuration nor a decorator option is set, the
audience is **not** validated (the previous behavior). The configuration key is optional and resolves to an "unset"
sentinel when absent, so leaving it out never breaks startup.

#### Per-controller override

You can still set (or override) the expected audience per route via the `@authenticator` decorator. A decorator option
always **wins** over the module-level configuration:

```ts
@authenticator(Auth0Authenticator, {expectedAudience: "https://api.my-service.com"})
export class MyController {
    // ...
}
```

`expectedAudience` accepts either a single audience (`string`) or several (`string[]`); with an array, the check passes
when the token's `aud` intersects the expected set.

These options are type-checked against `Auth0AuthenticatorOptionsInterface` — a mistyped or wrong-typed option (e.g.
`expectedScope` instead of `expectedScopes`) is a compile error.

**Resolution precedence** (first match wins):

1. The `@authenticator(Auth0Authenticator, {expectedAudience})` decorator option, when present.
2. The `pristine.auth0.expected.audience` configuration, otherwise.
3. If neither is set, the audience check is skipped.

### Example

**Pro Tip**: You can use the `@identity` decorator to decorate a parameter of your controller's method to retrieve the
decoded Jwt. Here's an example:

```
@authenticator(Auth0Authenticator)
public MyController {
    public myProtectedApiCall(@identity identity: IdentityInterface) {
    }
}
```

That's it, you now have your Pristine project integrated with Auth0.
