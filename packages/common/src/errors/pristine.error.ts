/**
 * Options carried by every `PristineError`. All fields optional — defaults give a sensible
 * "expected user-facing error with 500 / exit 1" shape when none are set.
 */
export interface PristineErrorOptions {
  /**
   * Stable slug for the error category, e.g. `"AUTH_TOKEN_INVALID"`, `"RESOURCE_NOT_FOUND"`.
   * Surfaces in HTTP response bodies and CLI stderr; safe to use as the join key for i18n,
   * log queries, and alerting rules. Defaults to `"INTERNAL_ERROR"` at render time when
   * absent.
   */
  code?: string;

  /**
   * HTTP status when this error reaches the HTTP boundary. Omit when the error has no
   * natural HTTP semantics (e.g. a CLI-only `ConfigError`) — the responder will fall back
   * to 500.
   */
  httpStatus?: number;

  /**
   * Process exit code when this error reaches the CLI boundary. Omit to fall back to
   * `1` for expected errors and `70` (`EX_SOFTWARE`) for unexpected ones.
   */
  exitCode?: number;

  /**
   * Underlying error this one wraps. Uses the standard `Error.cause` slot (Node 16.9+),
   * so any tooling that knows the standard cause chain works automatically. Walked by
   * `PristineError.from` to preserve the original error type when normalizing.
   */
  cause?: Error;

  /**
   * Structured fields safe to surface in the response body / stderr. Per-error-class
   * schema — e.g. a `NotFoundError` may carry `{ resource, id }`. Surfaced to users
   * only when `expected` is true (default) or `mode` is development.
   */
  details?: Record<string, unknown>;

  /**
   * `true` (default): caller-induced, safe to surface verbatim. Production responses
   * include the message and details; CLI prints the message and exits with `exitCode`.
   *
   * `false`: framework/system bug. Production responses replace the message with a
   * generic "Internal Server Error" / "Internal Error" and omit details + stack. The
   * raw error is still logged via the normal LogHandler path for operators.
   *
   * Raw `new Error("oops")` values get `expected: false` when run through
   * `PristineError.from`, so "unknown error" defaults to the safe rendering.
   */
  expected?: boolean;
}

/**
 * Single error base for the entire framework. Replaces the old `LoggableError` +
 * `HttpError` + ad-hoc subclass hierarchy.
 *
 * **What it gives you**:
 * - A structured `options` bag (`code`, `httpStatus`, `exitCode`, `details`, `cause`,
 *   `expected`) read by both the HTTP and CLI channel reporters.
 * - Automatic `error.name = ClassName` for subclasses.
 * - Automatic prototype-chain fix via `new.target.prototype` — subclasses never need to
 *   repeat the `Object.setPrototypeOf(this, FooError.prototype)` incantation.
 * - Standard `Error.cause` propagation (Node 16.9+ native).
 *
 * **Subclass form** when a named class makes `instanceof` checks read better:
 *
 * ```ts
 * export class TokenExpiredError extends PristineError {
 *   constructor(tokenId: string) {
 *     super("The token has expired", {
 *       code: "TOKEN_EXPIRED", httpStatus: 401, exitCode: 1,
 *       details: { tokenId },
 *     });
 *   }
 * }
 * ```
 *
 * **Direct form** when the call site self-documents:
 *
 * ```ts
 * throw new PristineError(`User '${id}' not found`, {
 *   code: "NOT_FOUND", httpStatus: 404, details: { resource: "User", id },
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
 *     code: "EVENT_DISPATCH_FAILED", cause, details: { eventId: event.id },
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
    // to repeat the boilerplate.
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);

    // `expected: true` is the default — most thrown errors in framework code are
    // user-facing. Unexpected ones (raw `Error`s, third-party throws) get `expected: false`
    // explicitly via `PristineError.from`.
    this.options = { expected: true, ...options };
  }

  /**
   * Normalizes any thrown value into a `PristineError`. The chokepoint that every channel
   * reporter funnels through before rendering, so the reporters never need to handle
   * unknown shapes.
   *
   * - `PristineError` instances pass through unchanged.
   * - `Error` instances are wrapped with `expected: false` and propagated as `cause` —
   *   the wrapper preserves the original message and stack for `mode === Development`
   *   rendering.
   * - Anything else (strings, numbers, `throw {someObject}`) is coerced via `String(...)`
   *   into a message with `expected: false`.
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
        expected: false,
      });
    }
    return new PristineError(String(error), {
      expected: false,
    });
  }
}
