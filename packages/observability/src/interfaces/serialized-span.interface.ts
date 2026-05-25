/**
 * The plain-object shape of a stored span — as produced by `TraceRenderer.serialize`
 * and rehydrated by `SpanDeserializer`.
 */
export interface SerializedSpan {
  id?: string;
  keyname: string;
  startDate: number;
  endDate?: number;
  context?: { [key: string]: string };
  children?: SerializedSpan[];
}
