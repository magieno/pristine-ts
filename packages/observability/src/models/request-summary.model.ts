/**
 * A one-line summary of a completed request (trace), appended to `requests.jsonl`. This
 * is the fast index the `requests` command reads — it avoids opening every full trace
 * file just to list recent requests, and serves as the lookup table that resolves
 * `requestId` / `traceId` back to the canonical `eventId` when they diverge.
 */
export class RequestSummary {
  /**
   * The canonical id — every event has one, every trace is named by it on disk.
   * Lookups by `eventId` go straight to the trace file; lookups by `traceId`/`requestId`
   * resolve through this index when they differ from `eventId`.
   */
  eventId: string;

  /**
   * Epoch milliseconds at which the trace started.
   */
  startedAt: number;

  /**
   * Total trace duration in milliseconds.
   */
  durationMs: number;

  /**
   * The keyname of the trace's root span.
   */
  rootKeyname: string;

  /**
   * Only set when the trace id differs from `eventId` (distributed tracing where a
   * W3C `traceparent` was propagated from an upstream caller). Omitted otherwise to
   * keep summary lines small.
   */
  traceId?: string;

  /**
   * Only set when the request id differs from `eventId` (e.g. an inbound HTTP request
   * whose `x-pristine-request-id` header carried a different value than what the
   * mapper used as the event id). Omitted otherwise.
   */
  requestId?: string;

  /**
   * HTTP method, when the trace was an HTTP request (populated by the networking
   * HTTP-to-trace enrichment). Undefined for non-HTTP traces.
   */
  httpMethod?: string;

  /**
   * HTTP request path, when available.
   */
  httpPath?: string;

  /**
   * HTTP response status code, when available.
   */
  httpStatus?: number;

  constructor(eventId: string, startedAt: number, durationMs: number, rootKeyname: string) {
    this.eventId = eventId;
    this.startedAt = startedAt;
    this.durationMs = durationMs;
    this.rootKeyname = rootKeyname;
  }
}
