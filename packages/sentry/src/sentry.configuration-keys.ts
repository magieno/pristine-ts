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
