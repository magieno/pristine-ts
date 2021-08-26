/**
 * This Error represents an error when trying to send a message to Sqs
 */
import {LoggableError} from "@pristine-ts/common";

export class SqsSendMessageError extends LoggableError {
    public constructor(originalError?: Error,
                       queueUrl?: string,
                       body?: string,
                       messageGroupId?: string,
                       delaySeconds?: number,
    ) {
        super(
            "There was an error sending an error to SQS",
            {
                originalError,
                queueUrl,
                body,
                messageGroupId,
                delaySeconds,
            }
        );

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, SqsSendMessageError.prototype);
    }
}