/**
 * The payload sent to `PubSubClient.publish(...)`. Mirrors `EventBridgeMessageModel` in
 * spirit — a structured input the client uses to build the SDK request.
 */
export class PubSubMessageModel {
  /**
   * The message body. Strings are UTF-8 encoded then base64-encoded on the wire.
   * Buffers are base64-encoded as-is.
   */
  data: string | Buffer;

  /**
   * Optional string attributes to attach.
   */
  attributes?: { [key: string]: string };

  /**
   * Optional ordering key for ordered delivery.
   */
  orderingKey?: string;
}
