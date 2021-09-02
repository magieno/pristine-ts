import {LoggableError, RequestInterface} from "@pristine-ts/common";

/**
 * This Error is thrown when an error happens in the execution of an error response interceptor.
 */
export class ErrorResponseInterceptionExecutionError extends LoggableError {

    public constructor(message: string, error: Error, request: RequestInterface, interceptor, previousError?: Error) {
        super(message, {
            previousError,
            error,
            request,
            interceptor,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, ErrorResponseInterceptionExecutionError.prototype);    }
}
