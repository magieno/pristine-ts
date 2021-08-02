import {LoggableError} from "@pristine-ts/common";

/**
 * This Error represents an error when resolving in SSM.
 */
export class SSMResolverError extends LoggableError {
    public constructor(message: string, value: any, originalError?: any) {
        super(message, {
            value,
            type: typeof(value),
            originalError
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, SSMResolverError.prototype);
    }
}
