/**
 * Typed configuration keys for `@pristine-ts/aws`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {AwsConfigurationKeys} from "@pristine-ts/aws";
 *
 * constructor(@injectConfig(AwsConfigurationKeys.Region) value: ...) {}
 * ```
 */
export const AwsConfigurationKeys = {
  Region: "pristine.aws.region",
} as const;
