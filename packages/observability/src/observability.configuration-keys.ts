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
 */
export const ObservabilityConfigurationKeys = {
  Enabled: "pristine.observability.enabled",
  Directory: "pristine.observability.directory",
  RetainedInstances: "pristine.observability.retainedInstances",
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
}

declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends ObservabilityConfigurationValueMap {}
}
