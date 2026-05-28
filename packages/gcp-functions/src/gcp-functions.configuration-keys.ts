import {GcpFunctionsEventsHandlingStrategyEnum} from "./enums/gcp-functions-events-handling-strategy.enum";

/**
 * Typed configuration keys for `@pristine-ts/gcp-functions`. Use these constants with
 * `@injectConfig` for autocomplete + rename safety, instead of typing the parameter
 * name as a string.
 */
export const GcpFunctionsConfigurationKeys = {
  CloudFunctionGen1HandlingStrategy: "pristine.gcp-functions.cloudFunctionGen1.handlingStrategy",
  CloudFunctionGen2HandlingStrategy: "pristine.gcp-functions.cloudFunctionGen2.handlingStrategy",
  CloudRunHandlingStrategy: "pristine.gcp-functions.cloudRun.handlingStrategy",
} as const;

/**
 * The expected runtime types for each configuration value defined by
 * `@pristine-ts/gcp-functions`. See `AwsConfigurationValueMap` in `@pristine-ts/aws`
 * for the full pattern + caveats.
 */
export interface GcpFunctionsConfigurationValueMap {
  "pristine.gcp-functions.cloudFunctionGen1.handlingStrategy": GcpFunctionsEventsHandlingStrategyEnum;
  "pristine.gcp-functions.cloudFunctionGen2.handlingStrategy": GcpFunctionsEventsHandlingStrategyEnum;
  "pristine.gcp-functions.cloudRun.handlingStrategy": GcpFunctionsEventsHandlingStrategyEnum;
}

/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends GcpFunctionsConfigurationValueMap {}
}
