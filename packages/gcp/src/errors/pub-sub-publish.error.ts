/**
 * Thrown by `PubSubClient` when publishing a message fails. Mirrors
 * `SqsSendMessageError` in `@pristine-ts/aws`.
 */
export class PubSubPublishError extends Error {
  constructor(
    public readonly cause: unknown,
    public readonly topic: string,
    public readonly attributes?: { [key: string]: string },
  ) {
    super(`PubSubClient: failed to publish to topic '${topic}'.`);
    Object.setPrototypeOf(this, PubSubPublishError.prototype);
    this.name = "PubSubPublishError";
  }
}
