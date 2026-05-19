/**
 * Categorizes a `PristineError` by who caused it. Replaces the older `expected: boolean`
 * field, whose meaning ("expected by whom?") wasn't self-explanatory.
 *
 * The kind drives how the channel reporters render the error in production mode:
 *
 * - `UserError`: caller did something wrong. Message is safe to expose verbatim;
 *   structured details surface as-is. HTTP responses use the carried `httpStatus`
 *   (typically 4xx). CLI stderr shows the message and details.
 *
 * - `SystemError`: framework or downstream bug — not the caller's fault. In production
 *   mode the message is replaced with a generic "Internal Server Error" / "Internal Error"
 *   so internal details never leak to clients. Stack and cause chain are still logged
 *   internally via the LogHandler for operators. In development mode (`PRISTINE_ENV=dev`)
 *   the full message surfaces.
 *
 * Default is `UserError` — most thrown errors in framework and application code are caller-
 * induced. `PristineError.from(unknown)` marks raw `Error` and non-Error throws as
 * `SystemError` since they didn't opt into the typed contract.
 */
export enum PristineErrorKind {
  UserError   = "user-error",
  SystemError = "system-error",
}
