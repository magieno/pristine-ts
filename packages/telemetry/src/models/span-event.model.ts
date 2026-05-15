/**
 * A named, timestamped marker attached to a `Span`. Represents a noteworthy moment
 * inside the span's lifetime that doesn't warrant a child span of its own — e.g.
 * "validation passed", "rate limit check ok", "found 50 rows in DB".
 *
 * Modeled after OpenTelemetry's "span events" concept: a `Span` carries `events: SpanEvent[]`
 * alongside its `children: Span[]`. Renderers (the breadcrumb trail in error logs, the
 * console/file tracer output, etc.) interleave events with spans by timestamp.
 *
 * Use `TracingManager.addEventToCurrentSpan(message, attributes?)` to add one — it finds
 * the most-recently-started in-progress span and attaches the event there.
 */
export class SpanEvent {
  /**
   * The timestamp in milliseconds at which the event was created. Used to interleave
   * events with sibling spans when rendering a sorted trail.
   */
  public readonly timestamp: number = Date.now();

  /**
   * Free-form attributes attached to the event. String-keyed for cheap serialization,
   * mirroring `Span.context`'s shape. `undefined` when the event carries no metadata.
   */
  public readonly attributes?: { [key: string]: string };

  constructor(public readonly message: string, attributes?: { [key: string]: string }) {
    this.attributes = attributes;
  }
}
