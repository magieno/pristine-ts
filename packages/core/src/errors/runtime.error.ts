/**
 * This error is a generic error thrown when the kernel is running and you need a generic error.
 */
import {LoggableError} from "@pristine-ts/common";

export class RuntimeError extends LoggableError {
    public constructor(readonly message: string) {
        super(message);

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, RuntimeError.prototype);
    }
}
