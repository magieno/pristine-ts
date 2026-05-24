import {Span, Trace} from "@pristine-ts/common";
import {SerializedSpan} from "../interfaces/serialized-span.interface";

/**
 * Rebuilds a `Span` (with its full child tree) from the stored plain object. Used by
 * `TraceDeserializer` for the trace's root span and recursively for every descendant —
 * so `traceRenderer.renderTree`/`renderFlat`, which call instance methods like
 * `getDuration()`, work unchanged on stored traces.
 */
export class SpanDeserializer {
  static deserialize(serialized: SerializedSpan, trace: Trace): Span {
    const span = new Span(serialized.keyname, serialized.id, serialized.context ?? {});
    span.trace = trace;
    span.startDate = serialized.startDate;
    span.endDate = serialized.endDate;
    span.inProgress = serialized.endDate === undefined;

    for (const child of serialized.children ?? []) {
      span.addChild(SpanDeserializer.deserialize(child, trace));
    }

    return span;
  }
}
