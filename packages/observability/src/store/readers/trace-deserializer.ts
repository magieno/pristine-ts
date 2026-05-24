import {Span, Trace} from "@pristine-ts/common";

/**
 * The plain-object shape of a stored span (as produced by `TraceRenderer.serialize`).
 */
interface SerializedSpan {
  id?: string;
  keyname: string;
  startDate: number;
  endDate?: number;
  context?: { [key: string]: string };
  children?: SerializedSpan[];
}

/**
 * The plain-object shape of a stored trace.
 */
export interface SerializedTrace {
  id: string;
  startDate: number;
  endDate?: number;
  context?: { [key: string]: string };
  rootSpan?: SerializedSpan;
}

/**
 * Rehydrates a stored trace JSON (the shape written by `ObservabilityTracer`) back into
 * `Trace`/`Span` instances, so `traceRenderer.renderTree`/`renderFlat` — which call
 * instance methods like `getDuration()` — work unchanged on stored traces.
 *
 * Stateless; instantiate once and reuse, or use the static `deserialize`.
 */
export class TraceDeserializer {
  /**
   * Rebuilds a `Trace` (with its full span tree) from the stored plain object.
   */
  static deserialize(serialized: SerializedTrace): Trace {
    const trace = new Trace(serialized.id, serialized.context ?? {});
    trace.startDate = serialized.startDate;
    trace.endDate = serialized.endDate;
    trace.hasEnded = serialized.endDate !== undefined;

    if (serialized.rootSpan !== undefined) {
      trace.rootSpan = TraceDeserializer.deserializeSpan(serialized.rootSpan, trace);
    }

    return trace;
  }

  private static deserializeSpan(serialized: SerializedSpan, trace: Trace): Span {
    const span = new Span(serialized.keyname, serialized.id, serialized.context ?? {});
    span.trace = trace;
    span.startDate = serialized.startDate;
    span.endDate = serialized.endDate;
    span.inProgress = serialized.endDate === undefined;

    for (const child of serialized.children ?? []) {
      span.addChild(TraceDeserializer.deserializeSpan(child, trace));
    }

    return span;
  }
}
