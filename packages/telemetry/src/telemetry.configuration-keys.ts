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
  ConsoleTracerActivated: "pristine.telemetry.console-tracer.activated",
  ConsoleTracerOutputMode: "pristine.telemetry.console-tracer.output-mode",
  ConsoleTracerMinimumDurationMs: "pristine.telemetry.console-tracer.minimum-duration-ms",
  FileTracerActivated: "pristine.telemetry.file-tracer.activated",
  FileTracerOutputMode: "pristine.telemetry.file-tracer.output-mode",
  FileTracerDirectory: "pristine.telemetry.file-tracer.directory",
  FileTracerFilenamePattern: "pristine.telemetry.file-tracer.filename-pattern",
} as const;

import {ConsoleTracerOutputModeEnum} from "./enums/console-tracer-output-mode.enum";

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/telemetry`.
 * See `AwsConfigurationValueMap` in `@pristine-ts/aws` for the full pattern + caveats.
 */
export interface TelemetryConfigurationValueMap {
  "pristine.telemetry.active": boolean;
  "pristine.telemetry.debug": boolean;
  "pristine.telemetry.console-tracer.activated": boolean;
  "pristine.telemetry.console-tracer.output-mode": ConsoleTracerOutputModeEnum;
  "pristine.telemetry.console-tracer.minimum-duration-ms": number;
  "pristine.telemetry.file-tracer.activated": boolean;
  "pristine.telemetry.file-tracer.output-mode": ConsoleTracerOutputModeEnum;
  "pristine.telemetry.file-tracer.directory": string;
  "pristine.telemetry.file-tracer.filename-pattern": string;
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
