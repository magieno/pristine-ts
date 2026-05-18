import {PristineError, PristineErrorOptions} from "./pristine.error";

/**
 * Standard library of typed errors used across the framework. Each carries the right
 * `httpStatus` + `exitCode` for its semantic category, so a `throw new NotFoundError(...)`
 * produces the right thing in both HTTP and CLI contexts without the throwing code
 * having to know which channel will catch it.
 *
 * Exit codes follow the `sysexits.h` convention where applicable — meaningful to shell
 * pipelines and `until`-style polling scripts.
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

type StandardOptions = Omit<PristineErrorOptions, "httpStatus" | "exitCode" | "expected">;

/** 400. Caller sent malformed/invalid input. CLI exit 65 (`EX_DATAERR`). */
export class BadRequestError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: "BAD_REQUEST", httpStatus: 400, exitCode: 65, expected: true,
      ...options,
    });
  }
}

/** 401. Caller is not authenticated. CLI exit 77 (`EX_NOPERM`). */
export class UnauthorizedError extends PristineError {
  constructor(message: string = "Unauthorized", options: StandardOptions = {}) {
    super(message, {
      code: "UNAUTHORIZED", httpStatus: 401, exitCode: 77, expected: true,
      ...options,
    });
  }
}

/** 403. Caller is authenticated but lacks permission. CLI exit 77 (`EX_NOPERM`). */
export class ForbiddenError extends PristineError {
  constructor(message: string = "Forbidden", options: StandardOptions = {}) {
    super(message, {
      code: "FORBIDDEN", httpStatus: 403, exitCode: 77, expected: true,
      ...options,
    });
  }
}

/** 404. Resource doesn't exist. CLI exit 1. */
export class NotFoundError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: "NOT_FOUND", httpStatus: 404, exitCode: 1, expected: true,
      ...options,
    });
  }
}

/** 409. Operation conflicts with existing state (duplicate, version mismatch, etc.). CLI exit 1. */
export class ConflictError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: "CONFLICT", httpStatus: 409, exitCode: 1, expected: true,
      ...options,
    });
  }
}

/** 422. Input parsed but failed semantic validation. CLI exit 65 (`EX_DATAERR`). */
export class ValidationError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: "VALIDATION_FAILED", httpStatus: 422, exitCode: 65, expected: true,
      ...options,
    });
  }
}

/**
 * Configuration loading / parsing / validation failure. No `httpStatus` — config errors
 * shouldn't be exposed to HTTP callers, so the responder will treat them as 500 with
 * sanitized message. CLI exit 78 (`EX_CONFIG`). Marked `expected: false` so the message
 * isn't surfaced verbatim in production HTTP responses.
 */
export class ConfigError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: "CONFIG_ERROR", exitCode: 78, expected: false,
      ...options,
    });
  }
}

/**
 * CLI-only — bad command-line usage (wrong flag, missing required arg, unknown command).
 * No `httpStatus`. CLI exit 64 (`EX_USAGE`).
 */
export class UsageError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: "USAGE_ERROR", exitCode: 64, expected: true,
      ...options,
    });
  }
}

/**
 * Catch-all for framework/system bugs that shouldn't be exposed verbatim. 500.
 * CLI exit 70 (`EX_SOFTWARE`). `expected: false` triggers message sanitization in
 * production mode.
 */
export class InternalError extends PristineError {
  constructor(message: string = "Internal error", options: StandardOptions = {}) {
    super(message, {
      code: "INTERNAL_ERROR", httpStatus: 500, exitCode: 70, expected: false,
      ...options,
    });
  }
}
