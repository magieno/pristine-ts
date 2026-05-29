/**
 * Confirmation returned from `PubSubClient.publish(...)`. Mirrors
 * `SqsMessageSentConfirmationModel`.
 */
export class PubSubMessageSentConfirmationModel {
  messageId: string;
}
