/**
 * Typed configuration keys for `@pristine-ts/telemetry`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {TelemetryConfigurationKeys} from "@pristine-ts/telemetry";
 *
 * constructor(@injectConfig(TelemetryConfigurationKeys.Active) value: ...) {}
 * ```
 */
export const TelemetryConfigurationKeys = {
  Active: "pristine.telemetry.active",
  Debug: "pristine.telemetry.debug",
} as const;

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/telemetry`.
 * See `AwsConfigurationValueMap` in `@pristine-ts/aws` for the full pattern + caveats.
 */
export interface TelemetryConfigurationValueMap {
  "pristine.telemetry.active": boolean;
  "pristine.telemetry.debug": boolean;
}


/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends TelemetryConfigurationValueMap {}
}
