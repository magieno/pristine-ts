import {ExitCode} from "./exit-code.enum";
import {PristineError, PristineErrorOptions} from "./pristine.error";
import {PristineErrorCode} from "./pristine-error-code.enum";
import {PristineErrorKind} from "./pristine-error-kind.enum";

/**
 * Standard library of typed errors used across the framework. Each carries the right
 * `httpStatus` + `exitCode` for its semantic category, so a `throw new NotFoundError(...)`
 * produces the right thing in both HTTP and CLI contexts without the throwing code
 * having to know which channel will catch it.
 *
 * Exit codes follow the `sysexits.h` convention via the `ExitCode` enum. Codes follow the
 * `PristineErrorCode` enum.
 *
 * **Subclass when you need `instanceof`-driven dispatch**:
 *
 * ```ts
 * export class TokenExpiredError extends UnauthorizedError {
 *   constructor(tokenId: string) {
 *     super("The token has expired", { code: "TOKEN_EXPIRED", details: { tokenId } });
 *   }
 * }
 * ```
 *
 * **Or throw directly** when no special name carries information:
 *
 * ```ts
 * throw new NotFoundError("User not found", { details: { id: userId } });
 * ```
 */

type StandardOptions = Omit<PristineErrorOptions, "httpStatus" | "exitCode" | "kind">;

/** 400. Caller sent malformed/invalid input. CLI exit `ExitCode.DataError` (65). */
export class BadRequestError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.BadRequest, httpStatus: 400, exitCode: ExitCode.DataError,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}

/** 401. Caller is not authenticated. CLI exit `ExitCode.NoPermission` (77). */
export class UnauthorizedError extends PristineError {
  constructor(message: string = "Unauthorized", options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.Unauthorized, httpStatus: 401, exitCode: ExitCode.NoPermission,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}

/** 403. Caller is authenticated but lacks permission. CLI exit `ExitCode.NoPermission` (77). */
export class ForbiddenError extends PristineError {
  constructor(message: string = "Forbidden", options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.Forbidden, httpStatus: 403, exitCode: ExitCode.NoPermission,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}

/** 404. Resource doesn't exist. CLI exit `ExitCode.Error` (1). */
export class NotFoundError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.NotFound, httpStatus: 404, exitCode: ExitCode.Error,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}

/** 409. Operation conflicts with existing state (duplicate, version mismatch, etc.). */
export class ConflictError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.Conflict, httpStatus: 409, exitCode: ExitCode.Error,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}

/** 422. Input parsed but failed semantic validation. CLI exit `ExitCode.DataError` (65). */
export class ValidationError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.ValidationFailed, httpStatus: 422, exitCode: ExitCode.DataError,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}

/**
 * Configuration loading / parsing / validation failure. No `httpStatus` — config errors
 * shouldn't be exposed to HTTP callers, so the responder will treat them as 500 with
 * sanitized message. CLI exit `ExitCode.Configuration` (78). Marked `SystemError` so the
 * message isn't surfaced verbatim in production HTTP responses.
 */
export class ConfigError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.ConfigError, exitCode: ExitCode.Configuration,
      kind: PristineErrorKind.SystemError,
      ...options,
    });
  }
}

/**
 * CLI-only — bad command-line usage (wrong flag, missing required arg, unknown command).
 * No `httpStatus`. CLI exit `ExitCode.Usage` (64).
 */
export class UsageError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.UsageError, exitCode: ExitCode.Usage,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}

/**
 * Catch-all for framework/system bugs that shouldn't be exposed verbatim. 500.
 * CLI exit `ExitCode.Software` (70). `SystemError` triggers message sanitization in
 * production mode.
 */
export class InternalError extends PristineError {
  constructor(message: string = "Internal error", options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.InternalError, httpStatus: 500, exitCode: ExitCode.Software,
      kind: PristineErrorKind.SystemError,
      ...options,
    });
  }
}
