import {LoggableError} from "@pristine-ts/common";

/**
 * This Error represents an error when trying to send a message to Sqs
 */
export class SqsSendMessageError extends LoggableError {

    /**
     * This Error represents an error when trying to send a message to Sqs
     * @param originalError
     * @param queueUrl
     * @param body
     * @param messageGroupId
     * @param delaySeconds
     */
    public constructor(originalError?: Error,
                       queueUrl?: string,
                       body?: string,
                       messageGroupId?: string,
                       delaySeconds?: number,
    ) {
        super(
            "There was an error sending a message to SQS",
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
