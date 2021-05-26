/**
 * This Error represents a 404 error.
 */
import {LoggableError} from "@pristine-ts/common";

export class DynamodbError extends LoggableError {
    public constructor(message?: string,
                       public readonly originalError?: Error,
                       public readonly tableName?: string,
                       public readonly primaryKey?: string,
                       ) {
        super(message ?? "DynamoDBError", {
            originalError,
            tableName,
            primaryKey,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, DynamodbError.prototype);
    }
}
