/**
 * This Error is thrown when there's an error that happens when the authenticator are being initialized
 */
import {LoggableError} from "@pristine-ts/common";

export class AuthenticatorInstantiationError extends LoggableError {
    public previousError?: Error;

    public constructor(message: string, instantiatedAuthenticator, authenticatorContext) {
        super(message, {
            instantiatedAuthenticator,
            authenticatorContext,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, AuthenticatorInstantiationError.prototype);
    }
}
