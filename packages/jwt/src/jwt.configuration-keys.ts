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

import {Algorithm} from "jsonwebtoken";

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/jwt`.
 * See `AwsConfigurationValueMap` in `@pristine-ts/aws` for the full pattern + caveats.
 *
 * Note: `Algorithm` comes from `jsonwebtoken`. The default resolver returns the string
 * `"HS256"`, but the type is the broader `Algorithm` literal union so callers that
 * override the value get full type checking on their override.
 */
export interface JwtConfigurationValueMap {
  "pristine.jwt.algorithm": Algorithm;
  "pristine.jwt.publicKey": string;
  "pristine.jwt.privateKey": string;
  "pristine.jwt.passphrase": string;
}


/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends JwtConfigurationValueMap {}
}
