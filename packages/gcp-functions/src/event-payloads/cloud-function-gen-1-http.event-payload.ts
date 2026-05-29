/**
 * The event payload for a Gen 1 HTTP-triggered Cloud Function, surfaced when the
 * handling strategy is `Event`. Gen 1 HTTP functions receive an Express-like raw
 * request shape: this payload captures it verbatim plus a parsed body if available.
 */
export class CloudFunctionGen1HttpEventPayload {
  method: string;
  url: string;
  path: string;
  headers: { [key: string]: string | string[] } = {};
  query: { [key: string]: string | string[] } = {};
  body?: string;
  rawBody?: string;
  ip?: string;

  constructor(method: string, url: string, path: string) {
    this.method = method;
    this.url = url;
    this.path = path;
  }
}
