import {injectable} from "tsyringe";
import {
  PristineError,
  PristineErrorCode,
  PristineErrorKind,
  Response,
} from "@pristine-ts/common";
import {EnvironmentManager, PristineEnvironment} from "@pristine-ts/core";

/**
 * Converts any thrown value into an HTTP `Response`. Single chokepoint that the Router
 * calls from its `catch` blocks — replaces the inline `if (error instanceof HttpError)`
 * block that used to leak stack traces by default.
 *
 * **Production mode (default)**: sanitized output. `SystemError`s render as
 * `{code: "INTERNAL_ERROR", message: "Internal Server Error"}` with no stack, no cause,
 * no internal message. `UserError`s (validation, auth, etc.) surface their code, message,
 * and `details` — those are safe by definition.
 *
 * **Development mode** (`pristine.environment = dev`, env override `PRISTINE_ENV=dev`):
 * everything is included — message, stack, cause chain, structured details. Useful when
 * debugging locally; never appropriate for a deployed instance.
 *
 * Anything that's not already a `PristineError` is normalized via `PristineError.from`,
 * which marks it `kind: PristineErrorKind.SystemError` and propagates the original via
 * the `cause` chain.
 *
 * The environment comes from `EnvironmentManager` — injected, not read from `process.env`
 * directly — so the value flows through the normal configuration graph and can be
 * overridden via `pristine.config.ts` like every other framework setting.
 *
 * **`request` is not set on the returned Response** — the responder doesn't know which
 * inbound request triggered the error. The router assigns `response.request` itself
 * after calling `respond()`.
 */
@injectable()
export class HttpErrorResponder {
  public constructor(
    private readonly environmentManager: EnvironmentManager,
  ) {
  }

  /**
   * Turns any thrown value into a `Response` with status and body populated. The caller
   * assigns `response.request` and layers any error-response interceptors on top.
   */
  respond(error: unknown): Response {
    const e = PristineError.from(error);
    const isDev = this.environmentManager.getEnvironment() === PristineEnvironment.Development;
    const isUserError = e.options.kind !== PristineErrorKind.SystemError;

    const status = e.options.httpStatus ?? 500;
    const code = e.options.code ?? PristineErrorCode.InternalError;

    // User errors: caller wrote them, message is meant for the user. Surface verbatim.
    // System errors in production: replace with a generic message so internal bugs
    // never leak details to API consumers.
    const messageForUser = isUserError
      ? e.message
      : (isDev ? e.message : (status === 500 ? "Internal Server Error" : "Error"));

    const body: Record<string, unknown> = {code, message: messageForUser};

    // `details` is only safe to expose for user errors — it's per-error-class structured
    // data that the throwing code explicitly chose to surface. In dev mode we expose it
    // even for system errors (helps debugging).
    if (e.options.details && (isUserError || isDev)) {
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

    const response = new Response();
    response.status = status;
    response.body = body;
    return response;
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
