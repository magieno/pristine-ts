import {LoggableError, RequestInterface} from "@pristine-ts/common";
import {Kernel} from "../kernel";

/**
 * This Error is thrown when there's an error in the execution of a request interceptor.
 */
export class RequestInterceptionExecutionError extends LoggableError {

    public constructor(message: string, request: RequestInterface, kernel: Kernel, error?: Error) {
        super(message, {
            error,
            request,
            kernel,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, RequestInterceptionExecutionError.prototype);    }
}
