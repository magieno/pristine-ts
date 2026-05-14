import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";

/**
 * Options to scope a `runWithSpan` call beyond just naming the span.
 */
export interface SpanRunnerOptions {
  /** When set, attach the new span as a child of the most recent span with this keyname. */
  parentKeyname?: string;
  /** Disambiguates parents when multiple spans share the same `parentKeyname`. */
  parentId?: string;
  /** Free-form context recorded on the span and surfaced in the rendered output. */
  context?: { [key: string]: string };
}

/**
 * Runs a function inside a span that is automatically ended when the function returns
 * or throws.
 *
 * Replaces the manual `start → try → finally end()` boilerplate:
 *
 * ```ts
 * // Before:
 * const span = this.tracingManager.startSpan("payment.charge");
 * try {
 *   return await this.client.charge(amount);
 * } finally {
 *   span.end();
 * }
 *
 * // After:
 * return spanRunner.runWithSpan(this.tracingManager, "payment.charge",
 *   () => this.client.charge(amount));
 * ```
 *
 * Why pass `tracingManager` explicitly? The manager is registered per-container, and
 * Pristine creates a child container per event. A "magic" lookup that finds the right
 * one requires AsyncLocalStorage propagation — deferred until that infrastructure
 * exists. For now, services inject `@inject("TracingManagerInterface") private readonly
 * tracingManager: TracingManagerInterface` and pass it through.
 *
 * On thrown errors: the error's name/message is attached to the span's context (visible
 * in the rendered tree/json output) and then re-thrown. The span is ended either way.
 *
 * Stateless — instantiate once and reuse, or use the exported singleton `spanRunner`.
 */
export class SpanRunner {
  /**
   * Runs `fn` inside a span. See class docs for full semantics.
   *
   * @typeParam T The return type of `fn`. Always wrapped in `Promise<T>` because the
   *   helper awaits internally — a sync `fn` works fine, but the return type loses its
   *   sync-ness.
   */
  async runWithSpan<T>(
    tracingManager: TracingManagerInterface,
    spanKeyname: string,
    fn: () => Promise<T> | T,
    options?: SpanRunnerOptions,
  ): Promise<T> {
    const span = tracingManager.startSpan(
      spanKeyname,
      options?.parentKeyname,
      options?.parentId,
      options?.context,
    );

    try {
      return await fn();
    } catch (error) {
      // Annotate the span with error info so it surfaces in the rendered output without
      // forcing the caller to remember to add it themselves. Span.context is string-typed
      // by design (cheap to serialize), so we coerce.
      if (error instanceof Error) {
        span.context = {
          ...span.context,
          error: "true",
          errorName: error.name,
          errorMessage: error.message,
        };
      } else {
        span.context = {
          ...span.context,
          error: "true",
          errorName: "non-error-throw",
          errorMessage: String(error),
        };
      }
      throw error;
    } finally {
      span.end();
    }
  }
}

/**
 * Default singleton. Stateless so sharing is safe.
 */
export const spanRunner = new SpanRunner();
