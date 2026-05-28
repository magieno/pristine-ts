/**
 * Thrown by `EventarcClient` when publishing fails. Mirrors `EventBridgeSendMessageError`
 * in `@pristine-ts/aws`.
 */
export class EventarcPublishError extends Error {
  constructor(public readonly cause: unknown) {
    super("EventarcClient: failed to publish event.");
    Object.setPrototypeOf(this, EventarcPublishError.prototype);
    this.name = "EventarcPublishError";
  }
}
