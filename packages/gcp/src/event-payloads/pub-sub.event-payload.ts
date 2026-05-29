/**
 * The Pristine event payload for a parsed GCP Pub/Sub push-subscription delivery.
 * Mirrors `SqsEventPayload` in shape: one payload per delivered message.
 */
export class PubSubEventPayload {
  /**
   * The Pub/Sub message ID assigned by GCP.
   */
  messageId: string;

  /**
   * The decoded message body. Pub/Sub delivers `data` as a base64 string; this is the
   * decoded UTF-8 form. Consumers needing the raw bytes can use `rawData`.
   */
  body: string;

  /**
   * The raw base64-encoded `data` field exactly as Pub/Sub delivered it.
   */
  rawData: string;

  /**
   * User-defined string attributes attached to the message.
   */
  attributes: { [key: string]: string } = {};

  /**
   * The subscription this delivery is for, e.g. `projects/my-proj/subscriptions/my-sub`.
   */
  subscription: string;

  /**
   * The time the message was published to Pub/Sub.
   */
  publishTime?: Date;

  /**
   * For ordered delivery — the ordering key chosen by the publisher.
   */
  orderingKey?: string;
}
