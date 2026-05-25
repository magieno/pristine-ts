import {SerializedSpan} from "./serialized-span.interface";

/**
 * The plain-object shape of a stored trace — as written to disk by
 * `ObservabilityTracer` and rehydrated by `TraceDeserializer`.
 */
export interface SerializedTrace {
  id: string;
  startDate: number;
  endDate?: number;
  context?: { [key: string]: string };
  rootSpan?: SerializedSpan;
}
