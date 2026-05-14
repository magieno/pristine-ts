/**
 * Typed configuration keys for `@pristine-ts/aws-xray`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {AwsXrayConfigurationKeys} from "@pristine-ts/aws-xray";
 *
 * constructor(@injectConfig(AwsXrayConfigurationKeys.Debug) value: ...) {}
 * ```
 */
export const AwsXrayConfigurationKeys = {
  Debug: "pristine.aws-xray.debug",
  Activated: "pristine.aws-xray.activated",
} as const;

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/aws-xray`.
 * See `AwsConfigurationValueMap` in `@pristine-ts/aws` for the full pattern + caveats.
 */
export interface AwsXrayConfigurationValueMap {
  "pristine.aws-xray.debug": boolean;
  "pristine.aws-xray.activated": boolean;
}


/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends AwsXrayConfigurationValueMap {}
}
