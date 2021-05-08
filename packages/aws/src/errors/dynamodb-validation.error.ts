/**
 * This Error represents a 404 error.
 */
import {DynamodbError} from "./dynamodb.error";

export class DynamodbValidationError extends DynamodbError {
    public constructor(originalError?: Error,
                       tableName?: string,
                       primaryKey?: string,
                       ) {
        super(
            "Validation error in dynamodb.",
            originalError,
            tableName
            );

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, DynamodbValidationError.prototype);
    }
}
