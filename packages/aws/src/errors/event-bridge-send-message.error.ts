import {PristineError} from "@pristine-ts/common";

/**
 * This Error represents an error when trying to send a message to Sqs
 */
export class EventBridgeSendMessageError extends PristineError {

  /**
   * This Error represents an error when trying to send a message to Sqs
   * @param originalError The original error that was caught.
   */
  public constructor(originalError?: Error,
  ) {
    super("There was an error sending a message to Event Bridge", {
      code: "EVENT_BRIDGE_SEND_FAILED",
      expected: false,
      cause: originalError,
    });
  }
}
