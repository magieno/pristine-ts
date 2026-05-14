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
