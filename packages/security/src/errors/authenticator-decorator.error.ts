/**
 * This Error is thrown when there's an error that happens when the guards ere being initialized
 */
import {LoggableError} from "@pristine-ts/common";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";

export class AuthenticatorDecoratorError extends LoggableError {

    public constructor(message: string, authenticator: AuthenticatorInterface | Function, options: any, target: any,
                       propertyKey?: string,
                       descriptor?: PropertyDescriptor) {
        super(message, {
            message,
            authenticator,
            options,
            target,
            propertyKey,
            descriptor,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, AuthenticatorDecoratorError.prototype);
    }
}
