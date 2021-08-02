/**
 * This Error represents a Dynamodb error when the item is not found.
 */
import {DynamodbError} from "./dynamodb.error";

export class DynamodbItemNotFoundError extends DynamodbError {
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
