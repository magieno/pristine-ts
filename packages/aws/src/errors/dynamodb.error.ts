
/**
 * This Error represents a 404 error.
 */
export class DynamodbError extends Error {
    public constructor(message?: string,
                       public readonly originalError?: Error,
                       public readonly tableName?: string,
                       public readonly primaryKey?: string,
                       ) {
        super(message);

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, DynamodbError.prototype);
    }
}
