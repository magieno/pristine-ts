import {LoggableError} from "@pristine-ts/common";

/**
 * This Error represents an error when trying to send a message to Sqs
 */
export class EventBridgeSendMessageError extends LoggableError {

  /**
   * This Error represents an error when trying to send a message to Sqs
   * @param originalError The original error that was caught.
   */
  public constructor(originalError?: Error,
  ) {
    super(
      "There was an error sending a message to Event Bridge",
      {
        originalError,
      }
    );

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, EventBridgeSendMessageError.prototype);
  }
}
