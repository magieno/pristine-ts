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
} as const;
