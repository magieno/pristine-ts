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
