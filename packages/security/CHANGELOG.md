# Changelog — @pristine-ts/security

## 4.0.3

- **`@authenticator` options can now be type-checked per authenticator.** The decorator is now generic and infers an
  options type from the authenticator class via an optional phantom `static __options` marker (see the new
  `AuthenticatorClass<TOptions>` type). `NoInfer` pins the type to the class so the `options` argument is *checked*
  against it rather than re-inferred from the object literal.

  An authenticator opts in with a single type-only line:

  ```ts
  class MyAuthenticator implements AuthenticatorInterface {
    declare static readonly __options?: MyAuthenticatorOptionsInterface;
    // ...
  }
  ```

  and `@authenticator(MyAuthenticator, { ... })` is then validated at the call site. **Fully backward compatible:**
  authenticators without the marker keep accepting any options (the parameter defaults to `any`), passing an instance
  is unaffected, and the decorator's runtime behavior is unchanged (the phantom marker emits no runtime field).
  `@pristine-ts/auth0` uses this for `Auth0AuthenticatorOptionsInterface`.
