/**
 * Typed configuration keys for `@pristine-ts/redis`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {RedisConfigurationKeys} from "@pristine-ts/redis";
 *
 * constructor(@injectConfig(RedisConfigurationKeys.Host) value: ...) {}
 * ```
 */
export const RedisConfigurationKeys = {
  Host: "pristine.redis.host",
  Port: "pristine.redis.port",
  Namespace: "pristine.redis.namespace",
} as const;

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/redis`.
 * See `AwsConfigurationValueMap` in `@pristine-ts/aws` for the full pattern + caveats.
 */
export interface RedisConfigurationValueMap {
  "pristine.redis.host": string;
  "pristine.redis.port": number;
  "pristine.redis.namespace": string;
}


/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends RedisConfigurationValueMap {}
}
