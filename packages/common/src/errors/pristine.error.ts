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

/**
 * Single error base for the entire framework. Replaces the old `LoggableError` +
 * `HttpError` + ad-hoc subclass hierarchy.
 *
 * **What it gives you**:
 * - A structured `options` bag (`code`, `httpStatus`, `exitCode`, `details`, `cause`,
 *   `kind`) read by both the HTTP and CLI channel reporters.
 * - Automatic `error.name = ClassName` for subclasses.
 * - Automatic prototype-chain fix via `new.target.prototype` — subclasses never need to
 *   repeat the `Object.setPrototypeOf(this, FooError.prototype)` incantation, AND
 *   `instanceof` works correctly for direct/standard-library/custom subclasses at any
 *   depth (verified by spec).
 * - Standard `Error.cause` propagation (Node 16.9+ native).
 *
 * **Subclass form** when a named class makes `instanceof` checks read better:
 *
 * ```ts
 * export class TokenExpiredError extends UnauthorizedError {
 *   constructor(tokenId: string) {
 *     super("The token has expired", {
 *       code: "TOKEN_EXPIRED",
 *       details: { tokenId },
 *     });
 *   }
 * }
 * // ...
 * try { ... }
 * catch (e) { if (e instanceof TokenExpiredError) ... }   // works.
 * ```
 *
 * **Direct form** when the call site self-documents:
 *
 * ```ts
 * throw new PristineError(`User '${id}' not found`, {
 *   code: PristineErrorCode.NotFound,
 *   httpStatus: 404,
 *   details: { resource: "User", id },
 * });
 * ```
 *
 * **Re-throw with enrichment** when catching, adding context, and re-throwing. Use the
 * standard `cause` chain rather than mutating the original — this preserves the original
 * error's identity for tooling that walks `error.cause`:
 *
 * ```ts
 * try { await dispatcher.dispatch(event); }
 * catch (cause) {
 *   throw new PristineError("Event dispatch failed", {
 *     code: "EVENT_DISPATCH_FAILED",
 *     kind: PristineErrorKind.SystemError,
 *     cause,
 *     details: { eventId: event.id },
 *   });
 * }
 * ```
 */
export class PristineError extends Error {
  public readonly options: PristineErrorOptions;

  constructor(message: string, options: PristineErrorOptions = {}) {
    // Use the standard Error.cause slot so any tooling that knows the standard chain
    // (debuggers, V8's default Error formatting, OpenTelemetry's exception recording)
    // picks it up automatically. We don't need a custom `originalError` slot.
    super(message, { cause: options.cause });

    // `new.target` is the actual class being constructed (subclass or PristineError
    // itself). Using it for both `name` and `setPrototypeOf` means subclasses never need
    // to repeat the boilerplate, and `instanceof` works correctly at every depth.
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);

    // `kind: UserError` is the default — most thrown errors are caller-induced. System
    // errors get marked explicitly via `kind: PristineErrorKind.SystemError` (or by
    // `PristineError.from` for unknown throws).
    this.options = { kind: PristineErrorKind.UserError, ...options };
  }

  /**
   * Normalizes any thrown value into a `PristineError`. The chokepoint that every channel
   * reporter funnels through before rendering, so the reporters never need to handle
   * unknown shapes.
   *
   * - `PristineError` instances pass through unchanged.
   * - `Error` instances are wrapped with `kind: SystemError` and propagated as `cause` —
   *   the wrapper preserves the original message and stack for `mode === Development`
   *   rendering.
   * - Anything else (strings, numbers, `throw {someObject}`) is coerced via `String(...)`
   *   into a message with `kind: SystemError`.
   *
   * The standard `Error.cause` chain is preserved: if the input has a `cause`, it stays
   * on the wrapper (which itself has the input as its cause), so a debugger walking
   * `error.cause.cause.cause` sees the full history.
   */
  static from(error: unknown): PristineError {
    if (error instanceof PristineError) {
      return error;
    }
    if (error instanceof Error) {
      return new PristineError(error.message, {
        cause: error,
        kind: PristineErrorKind.SystemError,
      });
    }
    return new PristineError(String(error), {
      kind: PristineErrorKind.SystemError,
    });
  }
}
