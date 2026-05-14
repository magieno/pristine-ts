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
