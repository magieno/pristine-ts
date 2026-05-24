import {Trace} from "@pristine-ts/common";
import {SerializedTrace} from "../interfaces/serialized-trace.interface";
import {SpanDeserializer} from "./span-deserializer";

/**
 * Rehydrates a stored trace JSON (the shape written by `ObservabilityTracer`) back into
 * a `Trace` instance, with its full span tree rebuilt via `SpanDeserializer`.
 */
export class TraceDeserializer {
  static deserialize(serialized: SerializedTrace): Trace {
    const trace = new Trace(serialized.id, serialized.context ?? {});
    trace.startDate = serialized.startDate;
    trace.endDate = serialized.endDate;
    trace.hasEnded = serialized.endDate !== undefined;

    if (serialized.rootSpan !== undefined) {
      trace.rootSpan = SpanDeserializer.deserialize(serialized.rootSpan, trace);
    }

    return trace;
  }
}
