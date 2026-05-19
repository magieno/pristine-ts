import {PristineError, PristineErrorKind} from "@pristine-ts/common";
import {EmailModel} from "../models/email.model";
import {AwsErrorCode} from "./aws-error-code.enum";

/**
 * This Error represents an error when trying to send a message to Sqs
 */
export class SesSendError extends PristineError {

  /**
   * This Error represents an error when trying to send a message to Sqs
   * @param originalError The original error that was caught.
   * @param email
   */
  public constructor(originalError?: Error,
                     email?: EmailModel,
  ) {
    super("There was an error sending an email to SES", {
      code: AwsErrorCode.SesSendFailed,
      kind: PristineErrorKind.SystemError,
      cause: originalError,
      details: {email},
    });
  }
}
