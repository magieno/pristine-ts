import {injectable} from "tsyringe";
import {getPristineMode, PristineError, PristineMode, Response} from "@pristine-ts/common";

/**
 * Converts any thrown value into an HTTP `Response`. Single chokepoint that the Router
 * calls from its `catch` blocks — replaces the inline `if (error instanceof HttpError)`
 * block that used to leak stack traces by default.
 *
 * **Production mode (default)**: sanitized output. Unexpected errors render as
 * `{code: "INTERNAL_ERROR", message: "Internal Server Error"}` with no stack, no cause,
 * no internal message. Expected errors (validation, auth, etc.) surface their code,
 * message, and `details` — those are safe by definition.
 *
 * **Development mode** (`PRISTINE_MODE=development`): everything is included — message,
 * stack, cause chain, structured details. Useful when debugging locally; never appropriate
 * for a deployed instance.
 *
 * Anything that's not already a `PristineError` is normalized via `PristineError.from`,
 * which marks it `expected: false` and propagates the original via the `cause` chain.
 */
@injectable()
export class HttpErrorResponder {
  /**
   * Build the response body for `error`. Returns a plain object — the caller assigns it
   * to a `Response` (the actual response object varies by router internals).
   */
  buildBody(error: unknown): {status: number; body: Record<string, unknown>} {
    const e = PristineError.from(error);
    const mode = getPristineMode();
    const isDev = mode === PristineMode.Development;

    const status = e.options.httpStatus ?? 500;
    const code = e.options.code ?? "INTERNAL_ERROR";

    // Expected errors: caller wrote them, message is meant for the user. Surface verbatim.
    // Unexpected errors in production: replace with a generic message so internal bugs
    // never leak details to API consumers.
    const messageForUser = e.options.expected
      ? e.message
      : (isDev ? e.message : (status === 500 ? "Internal Server Error" : "Error"));

    const body: Record<string, unknown> = {code, message: messageForUser};

    // `details` is only safe to expose when the error is expected — it's per-error-class
    // structured data that the throwing code explicitly chose to surface. In dev mode
    // we expose it even for unexpected errors (helps debugging).
    if (e.options.details && (e.options.expected || isDev)) {
      body.details = e.options.details;
    }

    // Dev-only fields. The cause chain is walked to whatever depth exists, so a nested
    // wrapper like `PristineError → BadRequestError → original ValidationError` shows
    // every level.
    if (isDev) {
      body.debugMessage = e.message;
      if (e.stack) body.stack = e.stack;
      const causeChain = this.collectCauseChain(e);
      if (causeChain.length > 0) body.cause = causeChain;
    }

    return {status, body};
  }

  /**
   * Walks the standard `Error.cause` chain (Node 16.9+ native) and produces a JSON-safe
   * representation. Used in dev mode to surface the full error history without forcing
   * the response object to carry live Error instances.
   */
  private collectCauseChain(error: Error): Array<{name: string; message: string; stack?: string}> {
    const chain: Array<{name: string; message: string; stack?: string}> = [];
    let current: unknown = (error as Error).cause;
    let depth = 0;
    while (current instanceof Error && depth < 10) {
      chain.push({name: current.name, message: current.message, stack: current.stack});
      current = (current as Error).cause;
      depth++;
    }
    return chain;
  }
}
