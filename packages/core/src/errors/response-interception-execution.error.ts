import {LoggableError, RequestInterface} from "@pristine-ts/common";
import {Response} from "@pristine-ts/networking";

/**
 * This Error is thrown when an error happens in the execution of a response interceptor.
 */
export class ResponseInterceptionExecutionError extends LoggableError {

    public constructor(message: string, request: RequestInterface, response: Response, interceptor, previousError?: Error) {
        super(message, {
            previousError,
            request,
            response,
            interceptor,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, ResponseInterceptionExecutionError.prototype);    }
}
