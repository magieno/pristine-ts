/**
 * This Error is thrown when there's an error that happens while the kernel or anything is being initialized.
 */
import {LoggableError, RequestInterface} from "@pristine-ts/common";
import {Kernel} from "../kernel";

export class RequestHandlingError extends LoggableError {

    public constructor(message: string, request: RequestInterface, kernel: Kernel) {
        super(message, {
            request,
            kernel,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, RequestHandlingError.prototype);    }
}
