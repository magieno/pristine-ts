/**
 * Standard error-code catalog used across the framework. Each value is a `SCREAMING_SNAKE_CASE`
 * slug surfaced in the HTTP response body (`{"code": ...}`) and on CLI stderr (`✗ CODE: ...`).
 *
 * **Use the enum members for framework-standard cases.** Consumers can add their own
 * domain-specific codes by passing a plain string — `PristineErrorOptions.code` is typed
 * `PristineErrorCode | string` so both the enum and free-form strings get autocomplete-
 * friendly type checking.
 *
 * ```ts
 * throw new PristineError("Token expired", {
 *   code: "TOKEN_EXPIRED",                       // consumer-defined code
 *   httpStatus: 401,
 * });
 *
 * throw new PristineError("Item missing", {
 *   code: PristineErrorCode.NotFound,            // framework-standard code
 *   httpStatus: 404,
 * });
 * ```
 */
export enum PristineErrorCode {
  BadRequest        = "BAD_REQUEST",
  Unauthorized      = "UNAUTHORIZED",
  Forbidden         = "FORBIDDEN",
  NotFound          = "NOT_FOUND",
  Conflict          = "CONFLICT",
  ValidationFailed  = "VALIDATION_FAILED",
  ConfigError       = "CONFIG_ERROR",
  UsageError        = "USAGE_ERROR",
  InternalError     = "INTERNAL_ERROR",
}
