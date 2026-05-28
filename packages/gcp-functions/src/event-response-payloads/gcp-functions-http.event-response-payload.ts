/**
 * Response payload returned by the GCP-Functions HTTP mappers' reverse mapping.
 * The entry-point shim (a Cloud Function `(req, res) => ...` handler or a Cloud Run
 * `http.Server` listener) reads this and translates it to the host response.
 *
 * Shape matches what Cloud Functions / Cloud Run expect: status code, headers,
 * body, and an `isBase64Encoded` flag for binary responses.
 */
export class GcpFunctionsHttpEventResponsePayload {
  /** Response headers (single-value). */
  headers: { [key: string]: string } = {};

  /** Whether the body is base64-encoded (set when the original response body was binary). */
  isBase64Encoded: boolean = false;

  /** The response body as a string (JSON-stringified for object bodies). */
  body?: string;

  constructor(public readonly statusCode: number, body?: string) {
    this.body = body;
  }
}
