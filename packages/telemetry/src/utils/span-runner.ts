import {EventContextManager} from "@pristine-ts/common";
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
 * Two call shapes are supported:
 *
 * **Explicit form** (`runWithSpan(tracingManager, name, fn)`) — pass the manager you've
 * already injected. Works anywhere, including outside an event context. Use this when
 * you have a `TracingManager` reference in hand:
 *
 * ```ts
 * return spanRunner.runWithSpan(this.tracingManager, "payment.charge",
 *   () => this.client.charge(amount));
 * ```
 *
 * **ALS form** (`runWithSpan(name, fn)`) — auto-resolves the `TracingManager` from the
 * active `EventContext`'s container. Concise; works when called from anywhere inside
 * a Pristine event (controller, service, etc.) without needing the manager threaded
 * through:
 *
 * ```ts
 * return spanRunner.runWithSpan("payment.charge", () => this.client.charge(amount));
 * ```
 *
 * If the ALS form is used outside any `EventContext` (e.g. a unit test that doesn't
 * boot a kernel), no span is created and `fn` runs unchanged — same no-throw contract
 * as the rest of the tracing layer.
 *
 * On thrown errors: the error's name/message is attached to the span's context (visible
 * in the rendered tree/JSON output) and then re-thrown. The span is ended either way.
 *
 * Stateless — instantiate once and reuse, or use the exported singleton `spanRunner`.
 */
export class SpanRunner {
  // Overload 1: explicit manager.
  runWithSpan<T>(
    tracingManager: TracingManagerInterface,
    spanKeyname: string,
    fn: () => Promise<T> | T,
    options?: SpanRunnerOptions,
  ): Promise<T>;
  // Overload 2: ALS auto-resolve.
  runWithSpan<T>(
    spanKeyname: string,
    fn: () => Promise<T> | T,
    options?: SpanRunnerOptions,
  ): Promise<T>;
  async runWithSpan<T>(
    tracingManagerOrSpanKeyname: TracingManagerInterface | string,
    spanKeynameOrFn: string | (() => Promise<T> | T),
    fnOrOptions?: (() => Promise<T> | T) | SpanRunnerOptions,
    maybeOptions?: SpanRunnerOptions,
  ): Promise<T> {
    // Disambiguate by the first argument's shape. A string means "ALS form"; an object
    // with `startSpan` means the explicit-manager form.
    let tracingManager: TracingManagerInterface | undefined;
    let spanKeyname: string;
    let fn: () => Promise<T> | T;
    let options: SpanRunnerOptions | undefined;

    if (typeof tracingManagerOrSpanKeyname === "string") {
      spanKeyname = tracingManagerOrSpanKeyname;
      fn = spanKeynameOrFn as () => Promise<T> | T;
      options = fnOrOptions as SpanRunnerOptions | undefined;
      // Resolve the manager from the active event context. If there isn't one (e.g. a
      // unit test calling this directly), fall back to running the function without a
      // span — tracing must never throw or change semantics.
      const container = EventContextManager.container();
      if (container !== undefined) {
        try {
          tracingManager = container.resolve<TracingManagerInterface>("TracingManagerInterface");
        } catch {
          tracingManager = undefined;
        }
      }
    } else {
      tracingManager = tracingManagerOrSpanKeyname;
      spanKeyname = spanKeynameOrFn as string;
      fn = fnOrOptions as () => Promise<T> | T;
      options = maybeOptions;
    }

    if (tracingManager === undefined) {
      // No manager available: ALS form called outside any event context, or no
      // TracingManager registered in the container. Run the function unchanged so
      // callers get the same behavior they'd see without `runWithSpan` wrapping at all.
      return await fn();
    }

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
