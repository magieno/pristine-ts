/**
 * Typed configuration keys for `@pristine-ts/jwt`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {JwtConfigurationKeys} from "@pristine-ts/jwt";
 *
 * constructor(@injectConfig(JwtConfigurationKeys.Algorithm) value: ...) {}
 * ```
 */
export const JwtConfigurationKeys = {
  Algorithm: "pristine.jwt.algorithm",
  PublicKey: "pristine.jwt.publicKey",
  PrivateKey: "pristine.jwt.privateKey",
  Passphrase: "pristine.jwt.passphrase",
} as const;
