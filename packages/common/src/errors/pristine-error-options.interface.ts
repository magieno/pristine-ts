import {ExitCode} from "./exit-code.enum";
import {PristineErrorCode} from "./pristine-error-code.enum";
import {PristineErrorKind} from "./pristine-error-kind.enum";

/**
 * Options carried by every `PristineError`. All fields optional — defaults give a sensible
 * "user error with 500 / exit 1" shape when none are set.
 */
export interface PristineErrorOptions {
  /**
   * Stable slug for the error category. Surfaces in HTTP response bodies and CLI stderr;
   * safe to use as the join key for i18n, log queries, and alerting rules.
   *
   * Accepts the framework's `PristineErrorCode` enum for standard categories, or any
   * `SCREAMING_SNAKE_CASE` string for domain-specific codes (`"TOKEN_EXPIRED"`,
   * `"STRIPE_CARD_DECLINED"`). The enum is the catalog of well-known codes; strings are
   * the extensibility hatch.
   *
   * Defaults to `PristineErrorCode.InternalError` at render time when absent.
   */
  code?: PristineErrorCode | string;

  /**
   * HTTP status when this error reaches the HTTP boundary. Omit when the error has no
   * natural HTTP semantics (e.g. a CLI-only `ConfigError`) — the responder will fall back
   * to 500.
   */
  httpStatus?: number;

  /**
   * Process exit code when this error reaches the CLI boundary. Accepts the framework's
   * `ExitCode` enum (sysexits.h-aligned) or any raw number for custom codes. Omit to fall
   * back to `ExitCode.Error` (1) for user errors and `ExitCode.Software` (70) for system
   * errors.
   */
  exitCode?: ExitCode | number;

  /**
   * Underlying error this one wraps. Uses the standard `Error.cause` slot (Node 16.9+),
   * so any tooling that knows the standard cause chain works automatically. Walked by
   * `PristineError.from` to preserve the original error type when normalizing.
   */
  cause?: Error;

  /**
   * Structured fields safe to surface in the response body / stderr. Per-error-class
   * schema — e.g. a `NotFoundError` may carry `{ resource, id }`. Surfaced to users
   * only when `kind === UserError` (the default) or `mode === development`.
   */
  details?: Record<string, unknown>;

  /**
   * Categorizes the error by who caused it. Drives how the message is rendered in
   * production mode:
   *
   * - `UserError` (default): caller did something wrong. Message surfaced verbatim;
   *   details exposed; production responses include both.
   *
   * - `SystemError`: framework/system bug, not the caller's fault. Production responses
   *   replace the message with a generic "Internal Server Error" / "Internal Error" and
   *   omit details + stack. The raw error is still logged via the LogHandler for
   *   operators. `PristineError.from` marks unknown throws as `SystemError`.
   */
  kind?: PristineErrorKind;
}
