import {LoggableError} from "@pristine-ts/common";

/**
 * This Error is thrown when there's an error that happens while the kernel or anything is being initialized.
 */
export class KernelInitializationError extends LoggableError {

    public constructor(message: string) {
        super(message);

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, KernelInitializationError.prototype);    }
}
