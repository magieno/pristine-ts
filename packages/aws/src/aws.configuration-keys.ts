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

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/aws`.
 *
 * Use this map with the `<T>` generic on `@injectConfig` (and with the planned
 * `pristine-ts/eslint-plugin` rule) to document the value type at the call site:
 *
 * ```ts
 * @injectConfig<AwsConfigurationValueMap[typeof AwsConfigurationKeys.Region]>(
 *   AwsConfigurationKeys.Region,
 * ) private readonly region: string,
 * ```
 *
 * TypeScript cannot enforce the parameter type matches this map (parameter decorators
 * have no API for that). The map exists for documentation, programmatic config-manager
 * lookups, and future lint-time enforcement.
 */
export interface AwsConfigurationValueMap {
  "pristine.aws.region": string;
}


/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends AwsConfigurationValueMap {}
}
