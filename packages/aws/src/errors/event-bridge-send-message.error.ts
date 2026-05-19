import {PristineError, PristineErrorKind} from "@pristine-ts/common";
import {AwsErrorCode} from "./aws-error-code.enum";

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
      code: AwsErrorCode.EventBridgeSendFailed,
      kind: PristineErrorKind.SystemError,
      cause: originalError,
    });
  }
}
