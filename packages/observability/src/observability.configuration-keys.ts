/**
 * Typed configuration keys for `@pristine-ts/observability`. Use these constants with
 * `@injectConfig` for autocomplete + rename safety, instead of typing the parameter name
 * as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {ObservabilityConfigurationKeys} from "@pristine-ts/observability";
 *
 * constructor(@injectConfig(ObservabilityConfigurationKeys.Enabled) value: ...) {}
 * ```
 *
 * The `max*` keys are the disk-retention controls. `MaxStoreSize` is the one that
 * matters operationally: it is the hard ceiling on everything the store occupies, across
 * every process. The others shape *how* that space is spent — how large one file grows,
 * how many rotated generations are kept, how many trace files a partition holds.
 */
export const ObservabilityConfigurationKeys = {
  Enabled: "pristine.observability.enabled",
  Directory: "pristine.observability.directory",
  RetainedInstances: "pristine.observability.retainedInstances",
  MaxStoreSize: "pristine.observability.maxStoreSize",
  MaxLogFileSize: "pristine.observability.maxLogFileSize",
  MaxLogFiles: "pristine.observability.maxLogFiles",
  MaxTraceFiles: "pristine.observability.maxTraceFiles",
  MaxTraceFileSize: "pristine.observability.maxTraceFileSize",
  MaxEntrySize: "pristine.observability.maxEntrySize",
  MaxRetentionAgeInMilliseconds: "pristine.observability.maxRetentionAgeInMilliseconds",
  LogSeverityLevelConfiguration: "pristine.observability.logSeverityLevelConfiguration",
} as const;

/**
 * The expected runtime types for each configuration value defined by
 * `@pristine-ts/observability`. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
export interface ObservabilityConfigurationValueMap {
  "pristine.observability.enabled": boolean;
  "pristine.observability.directory": string;
  "pristine.observability.retainedInstances": number;
  "pristine.observability.maxStoreSize": number;
  "pristine.observability.maxLogFileSize": number;
  "pristine.observability.maxLogFiles": number;
  "pristine.observability.maxTraceFiles": number;
  "pristine.observability.maxTraceFileSize": number;
  "pristine.observability.maxEntrySize": number;
  "pristine.observability.maxRetentionAgeInMilliseconds": number;
  "pristine.observability.logSeverityLevelConfiguration": number;
}

declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends ObservabilityConfigurationValueMap {}
}
