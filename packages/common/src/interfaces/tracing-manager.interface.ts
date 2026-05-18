import {Span} from "../models/span.model";
import {Trace} from "../models/trace.model";

/**
 * This interface specifies what a tracing manager should implement.
 *
 * Lives in `@pristine-ts/common` so any package can declare a `TracingManagerInterface`
 * dependency or use the `@traced` decorator / `spanRunner` helper without taking a
 * direct dep on `@pristine-ts/telemetry`. The concrete implementation
 * (`TracingManager`, plus the tracers that consume traces) still lives in telemetry.
 */
export interface TracingManagerInterface {
  /**
   * This property contains a reference to the active trace.
   */
  trace?: Trace

  /**
   * This methods starts the Tracing. This should be the first method called before doing anything else.
   * @param spanRootKeyname The keyname of the span at the root.
   * @param traceId The trace id if there is one.
   * @param context The context if there is one.
   */
  startTracing(spanRootKeyname?: string, traceId?: string, context?: { [key: string]: string }): Span;

  /**
   * This method ends the trace entirely.
   */
  endTrace(): void;

  /**
   * This method starts a new span.
   * @param keyname The keyname for this new span.
   * @param parentKeyname The keyname of the parent span.
   * @param parentId The id of the parent span.
   * @param context The context if there is one.
   */
  startSpan(keyname: string, parentKeyname?: string, parentId?: string, context?: { [key: string]: string }): Span;

  /**
   * This methods adds an already created Span to the trace. It assumes that it its hierarchy is correct.
   * @param span The span to add.
   */
  addSpan(span: Span): Span;

  /**
   * This methods ends the span by setting the end date and by calling the tracers.
   * It will also end the trace if the rootspan is being ended.
   * @param span The span to end.
   */
  endSpan(span: Span): void;

  /**
   * This method ends the span using a keyname.
   * @param keyname The keyname of the span to end.
   */
  endSpanKeyname(keyname: string): void;

  /**
   * Attaches a named, timestamped event to the most-recently-started in-progress span.
   * Use for noteworthy moments inside a span's lifetime that don't warrant their own
   * child span — "validation passed", "found 50 rows", etc. Logs a warning and drops
   * the marker if no span is currently active.
   */
  addEventToCurrentSpan(message: string, attributes?: { [key: string]: string }): void;

  /**
   * Returns the active trace's spans + their events as a flat, timestamp-sorted list.
   * Public utility for custom tracers, debug endpoints, test helpers, or any consumer
   * who wants "the active trace as a flat list" without walking the span tree manually.
   * Returns an empty array when no active trace exists.
   */
  getCurrentTrail(): Array<{
    kind: "span" | "event";
    name: string;
    date: Date;
    attributes: { [key: string]: string };
  }>;
}
