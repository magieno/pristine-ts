import {LoggableError} from "@pristine-ts/common";

/**
 * This Error represents an error when trying to get a secret from Secrets Manager
 */
export class GetSecretSecretsManagerError extends LoggableError {

    /**
     * This Error represents an error when trying to get a secret from Secrets Manager
     * @param message The message to throw
     */
    public constructor(message: string) {
        super(message);

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, GetSecretSecretsManagerError.prototype);
    }
}
