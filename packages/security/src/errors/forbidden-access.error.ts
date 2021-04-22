/**
 * This Error is thrown when there's you try to decode a JWT in a request but the AuthorizationHeader is missing.
 */
export class ForbiddenAccessError extends Error {
    public previousError?: Error;

    public constructor(message: string, previousError?: Error) {
        super(message + ". Previous error:" + previousError?.message);

        this.previousError = previousError;

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, ForbiddenAccessError.prototype);    }
}
