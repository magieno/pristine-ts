/**
 * Typed configuration keys for `@pristine-ts/sentry`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {SentryConfigurationKeys} from "@pristine-ts/sentry";
 *
 * constructor(@injectConfig(SentryConfigurationKeys.SentryDsn) value: ...) {}
 * ```
 */
export const SentryConfigurationKeys = {
  SentryDsn: "pristine.sentry.sentryDsn",
  TagRelease: "pristine.sentry.tagRelease",
  SentrySampleRate: "pristine.sentry.sentrySampleRate",
  SentryActivated: "pristine.sentry.sentryActivated",
} as const;

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/sentry`.
 * See `AwsConfigurationValueMap` in `@pristine-ts/aws` for the full pattern + caveats.
 */
export interface SentryConfigurationValueMap {
  "pristine.sentry.sentryDsn": string;
  "pristine.sentry.tagRelease": string;
  "pristine.sentry.sentrySampleRate": number;
  "pristine.sentry.sentryActivated": boolean;
}


/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends SentryConfigurationValueMap {}
}
