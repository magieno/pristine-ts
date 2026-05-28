/**
 * The event payload for a Gen 2 Cloud Function delivered as a CloudEvent over HTTP.
 * Surfaced when the handling strategy is `Event`.
 *
 * Gen 2 functions can receive either:
 *   - A direct HTTP request (then `CloudFunctionGen1` shape applies — they're
 *     interchangeable for plain HTTP-triggered functions), OR
 *   - A CloudEvent envelope, which is what this payload represents. The CloudEvent
 *     attributes arrive as `ce-*` HTTP headers; `data` is in the body.
 */
export class CloudFunctionGen2HttpEventPayload {
  /** CloudEvent `id` (from `ce-id`). */
  id: string;
  /** CloudEvent `specversion` (from `ce-specversion`). */
  specVersion: string;
  /** CloudEvent `type` (from `ce-type`). */
  type: string;
  /** CloudEvent `source` (from `ce-source`). */
  source: string;
  /** CloudEvent `subject` (from `ce-subject`), if present. */
  subject?: string;
  /** CloudEvent `time`, parsed if present. */
  time?: Date;
  /** CloudEvent `datacontenttype`, if present. */
  dataContentType?: string;
  /** The body of the request, decoded according to `datacontenttype`. */
  data: any;
  /** The raw HTTP headers, in case consumers need extra context. */
  headers: { [key: string]: string | string[] } = {};
}
