/**
 * This Error is thrown when you try to decode a JWT but the token is invalid.
 */
import {LoggableError, RequestInterface} from "@pristine-ts/common";

export class InvalidJwtError extends LoggableError {

    public constructor(message: string, previousError: Error, request: RequestInterface, token, algorithm, publicKey) {
        super(message, {
            request,
            previousError,
            token,
            algorithm,
            publicKey,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, InvalidJwtError.prototype);    }
}
