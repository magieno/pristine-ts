/**
 * Two-mode toggle that controls how errors are surfaced through the channel reporters
 * (`HttpErrorResponder` in networking, `CliErrorReporter` in cli).
 *
 * - `Production`: sanitized output. Internal-error messages are replaced with a generic
 *   "Internal Error"; stack traces and the cause chain are omitted from HTTP responses
 *   and CLI stderr. Safe to expose to end users.
 * - `Development`: verbose output. Internal-error messages, full stack, cause chain, and
 *   structured details are surfaced. For local development and debugging only.
 *
 * Default: `Production`. Switch by setting `PRISTINE_MODE=development`. Both reporters
 * read from the same source via `getPristineMode()`, so the toggle is global to the
 * process — you cannot mix "verbose HTTP, sanitized CLI" or vice-versa.
 */
export enum PristineMode {
  Production = "production",
  Development = "development",
}

/**
 * Returns the active `PristineMode`, read from `process.env.PRISTINE_MODE` at call time.
 *
 * Read at call time (not module-load time) so tests and runtime config can flip the
 * mode without restarting. Unrecognized values default to `Production` — fail safe.
 */
export const getPristineMode = (): PristineMode => {
  const raw = (process.env.PRISTINE_MODE ?? "").toLowerCase();
  return raw === PristineMode.Development ? PristineMode.Development : PristineMode.Production;
};
