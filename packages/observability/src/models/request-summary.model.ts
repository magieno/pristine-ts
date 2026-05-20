/**
 * A one-line summary of a completed request (trace), appended to `requests.jsonl`. This
 * is the fast index the `requests` command reads — it avoids opening every full trace
 * file just to list recent requests.
 */
export class RequestSummary {
  /**
   * The trace id (also the eventId) — the correlation id for the request.
   */
  traceId: string;

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

  constructor(traceId: string, startedAt: number, durationMs: number, rootKeyname: string) {
    this.traceId = traceId;
    this.startedAt = startedAt;
    this.durationMs = durationMs;
    this.rootKeyname = rootKeyname;
  }
}
