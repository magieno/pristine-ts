/**
 * Typed configuration keys for `@pristine-ts/gcp`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {GcpConfigurationKeys} from "@pristine-ts/gcp";
 *
 * constructor(@injectConfig(GcpConfigurationKeys.ProjectId) value: string) {}
 * ```
 */
export const GcpConfigurationKeys = {
  ProjectId: "pristine.gcp.projectId",
  Region: "pristine.gcp.region",
  Credentials: "pristine.gcp.credentials",
} as const;

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/gcp`.
 * See `AwsConfigurationValueMap` in `@pristine-ts/aws` for the full pattern + caveats.
 */
export interface GcpConfigurationValueMap {
  "pristine.gcp.projectId": string;
  "pristine.gcp.region": string;
  "pristine.gcp.credentials": string;
}

/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends GcpConfigurationValueMap {}
}
