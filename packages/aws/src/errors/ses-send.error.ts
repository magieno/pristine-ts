import {LoggableError} from "@pristine-ts/common";
import {EmailModel} from "../models/email.model";

/**
 * This Error represents an error when trying to send a message to Sqs
 */
export class SesSendError extends LoggableError {

    /**
     * This Error represents an error when trying to send a message to Sqs
     * @param originalError The original error that was caught.
     * @param email
     */
    public constructor(originalError?: Error,
                       email?: EmailModel,
    ) {
        super(
            "There was an error sending an email to SES",
            {
                originalError,
                email
            }
        );

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, SesSendError.prototype);
    }
}
