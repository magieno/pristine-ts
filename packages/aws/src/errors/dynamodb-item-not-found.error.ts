import {DynamodbError} from "./dynamodb.error";

/**
 * This Error is for when an item is not found in the DynamoDB table.
 * This error is not exported outside of this module as it should not be used.
 * When an item is not found it should not throw an error but rather return null.
 */
export class DynamodbItemNotFoundError extends DynamodbError {

    /**
     * This Error is for when an item is not found in the DynamoDB table.
     * This error is not exported outside of this module as it should not be used.
     * When an item is not found it should not throw an error but rather return null.
     * @param originalError The original error that was caught.
     * @param tableName The name of the DynamoDB table where the error happened.
     * @param primaryKey The primary key of the item that caused the error.
     */
    public constructor(originalError?: Error,
                       tableName?: string,
                       primaryKey?: string,) {
        super(
            "The item was not found in dynamodb.",
            originalError,
            tableName,
            );

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, DynamodbItemNotFoundError.prototype);
    }
}
