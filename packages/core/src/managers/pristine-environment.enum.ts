/**
 * Well-known runtime environments. Drives how the channel reporters
 * (`HttpErrorResponder` in networking, `CliErrorReporter` in cli) surface errors.
 *
 * - `Production`: sanitized output. Internal-error messages are replaced with a generic
 *   "Internal Error"; stack traces and the cause chain are omitted from HTTP responses
 *   and CLI stderr. Safe to expose to end users.
 * - `Development`: verbose output. Internal-error messages, full stack, cause chain, and
 *   structured details are surfaced. For local development and debugging only.
 *
 * Custom environments (e.g. `"staging"`, `"qa"`) are also supported — `EnvironmentManager`
 * returns `string | PristineEnvironment`, so consumers that care about non-default
 * environments can branch on the raw string. Anything that isn't `"dev"` continues to
 * render sanitized output (fail-safe default).
 *
 * Default: `Production`. Set via the `pristine.environment` configuration (env override:
 * `PRISTINE_ENV`). Resolved through DI by `EnvironmentManager.getEnvironment()` — both
 * reporters inject `EnvironmentManager` rather than reading the env directly, so the
 * environment is part of the application's configuration graph like every other
 * framework setting.
 */
export enum PristineEnvironment {
  Production = "prod",
  Development = "dev",
}
