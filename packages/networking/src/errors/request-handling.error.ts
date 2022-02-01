import {LoggableError, Request} from "@pristine-ts/common";

/**
 * This Error is thrown when there's an error that happens while handling a request.
 */
export class RequestHandlingError extends LoggableError {

    public constructor(message: string, request: Request) {
        super(message, {
            request,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, RequestHandlingError.prototype);    }
}
