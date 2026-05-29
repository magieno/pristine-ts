/**
 * The event payload for a Cloud Run HTTP request, surfaced when the handling
 * strategy is `Event`. Same shape as Gen 1 (both are raw HTTP), but kept as a
 * distinct class so downstream handlers can differentiate via `instanceof`.
 */
export class CloudRunHttpEventPayload {
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
