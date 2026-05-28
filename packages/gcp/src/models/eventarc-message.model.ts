/**
 * The payload sent to `EventarcClient.publish(...)`. CloudEvent-shaped.
 */
export class EventarcMessageModel {
  /**
   * CloudEvent `type`.
   */
  type: string;

  /**
   * CloudEvent `source`.
   */
  source: string;

  /**
   * CloudEvent `subject`, optional.
   */
  subject?: string;

  /**
   * CloudEvent `data` — opaque payload.
   */
  data?: any;

  /**
   * CloudEvent `datacontenttype`, e.g. `application/json`.
   */
  dataContentType?: string;
}
