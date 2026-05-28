/**
 * Optional per-call options shared across all GCP clients. Mirrors `ClientOptionsInterface`
 * in `@pristine-ts/aws`.
 */
export interface GcpClientOptionsInterface {
  /**
   * The per-request timeout in milliseconds. Forwarded to the underlying SDK when
   * supported.
   */
  requestTimeout?: number;

  /**
   * The Pristine event id, threaded through for logging/tracing correlation.
   */
  eventId?: string;

  /**
   * The Pristine event group id, threaded through for logging/tracing correlation.
   */
  eventGroupId?: string;
}
