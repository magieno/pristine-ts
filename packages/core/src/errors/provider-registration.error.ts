import {LoggableError} from "@pristine-ts/common";
import {Kernel} from "../kernel";

/**
 * This Error is thrown when there's an error that happens while trying to register a Provider registration.
 */
export class ProviderRegistrationError extends LoggableError {

    public constructor(message: string, providerRegistration: any, kernel: Kernel) {
        super(message, {
            providerRegistration,
            kernel,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, ProviderRegistrationError.prototype);    }
}
