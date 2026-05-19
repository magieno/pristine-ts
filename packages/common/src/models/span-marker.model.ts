/**
 * A named, timestamped marker attached to a `Span`. Represents a noteworthy moment
 * inside the span's lifetime that doesn't warrant a child span of its own — e.g.
 * "validation passed", "rate limit check ok", "found 50 rows in DB".
 *
 * **Markers are instants, not durations.** They carry a single timestamp; they have no
 * children and no end date. If you need hierarchical timing, spawn a child `Span`
 * instead — that gives you start/end semantics and its own marker list.
 *
 * Modeled after OpenTelemetry's "span events" concept (we renamed `event` → `marker`
 * here because `Event` is heavily overloaded in Pristine's dispatched-event domain —
 * `Event<T>`, `EventHandler`, `EventPipeline`, `EventDispatcher`, etc.). A `Span` carries
 * `markers: SpanMarker[]` alongside its `children: Span[]`. Renderers interleave markers
 * with child spans by timestamp to produce a chronological trail of what happened.
 *
 * Use `TracingManager.addMarkerToCurrentSpan(message, attributes?)` to add one — it
 * finds the most-recently-started in-progress span and attaches the marker there.
 */
export class SpanMarker {
  /**
   * The timestamp in milliseconds at which the marker was created. Used to interleave
   * markers with sibling spans when rendering a sorted trail.
   */
  public readonly timestamp: number = Date.now();

  /**
   * Free-form attributes attached to the marker. String-keyed for cheap serialization,
   * mirroring `Span.context`'s shape. `undefined` when the marker carries no metadata.
   */
  public readonly attributes?: { [key: string]: string };

  constructor(public readonly message: string, attributes?: { [key: string]: string }) {
    this.attributes = attributes;
  }
}
