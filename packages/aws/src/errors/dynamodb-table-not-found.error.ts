import {DynamodbError} from "./dynamodb.error";

/**
 * This Error represents a Dynamodb error when the table is not found.
 */
export class DynamodbTableNotFoundError extends DynamodbError {

    /**
     * This Error represents a Dynamodb error when the table is not found.
     * @param originalError The original error that was caught.
     * @param tableName The table name that does not exist.
     */
    public constructor(originalError?: Error,
                       tableName?: string) {
        super(
            "The table was not found in dynamodb.",
            originalError,
            tableName,
        );

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, DynamodbTableNotFoundError.prototype);
    }
}
