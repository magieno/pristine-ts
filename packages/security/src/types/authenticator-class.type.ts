import {AuthenticatorInterface} from "../interfaces/authenticator.interface";

/**
 * A class (constructor) that produces an {@link AuthenticatorInterface}, optionally
 * advertising the type of the options object accepted by
 * `@authenticator(ThisClass, options)`.
 *
 * An authenticator opts into typed decorator options by declaring a phantom static
 * `__options` field of the desired options type:
 *
 * ```ts
 * class MyAuthenticator implements AuthenticatorInterface {
 *   declare static readonly __options?: MyAuthenticatorOptionsInterface;
 *   // ...
 * }
 * ```
 *
 * It is type-only (`declare` emits nothing at runtime). The `authenticator` decorator
 * infers `TOptions` from it and type-checks the options argument at the call site.
 * Authenticators that don't declare it leave `TOptions` at its `any` default, so their
 * options stay unchecked — exactly the previous behavior.
 */
export type AuthenticatorClass<TOptions = any> =
  (new (...args: any[]) => AuthenticatorInterface) & { readonly __options?: TOptions };
