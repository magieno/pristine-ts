/**
 * The trace a caller is part of, read from a W3C `traceparent` value.
 * See https://www.w3.org/TR/trace-context/#traceparent-header.
 */
export class TraceParent {
  /**
   * @param traceId The trace id, in the UUID form Pristine uses for `Trace.id`
   * (`4bf92f35-77b3-4da6-a3ce-929d0e0e4736` for the W3C `4bf92f3577b34da6a3ce929d0e0e4736`).
   * @param parentSpanId The id of the caller's span (16 lowercase hex characters).
   * @param isSampled Whether the caller recorded its part of the trace (the `sampled` flag).
   */
  public constructor(
    public readonly traceId: string,
    public readonly parentSpanId: string,
    public readonly isSampled: boolean,
  ) {
  }
}
