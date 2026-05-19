/**
 * Options to scope a `SpanRunner.runWithSpan` call beyond just naming the span.
 */
export interface SpanRunnerOptions {
  /** When set, attach the new span as a child of the most recent span with this keyname. */
  parentKeyname?: string;
  /** Disambiguates parents when multiple spans share the same `parentKeyname`. */
  parentId?: string;
  /** Free-form context recorded on the span and surfaced in the rendered output. */
  context?: { [key: string]: string };
}
