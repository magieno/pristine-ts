/**
 * Typed configuration keys for `@pristine-ts/security`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {SecurityConfigurationKeys} from "@pristine-ts/security";
 *
 * constructor(@injectConfig(SecurityConfigurationKeys.RolesClaimKey) value: ...) {}
 * ```
 */
export const SecurityConfigurationKeys = {
  RolesClaimKey: "pristine.security.rolesClaimKey",
} as const;

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/security`.
 * See `AwsConfigurationValueMap` in `@pristine-ts/aws` for the full pattern + caveats.
 */
export interface SecurityConfigurationValueMap {
  "pristine.security.rolesClaimKey": string;
}


/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends SecurityConfigurationValueMap {}
}
