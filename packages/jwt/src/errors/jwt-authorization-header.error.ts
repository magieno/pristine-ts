import {LoggableError, RequestInterface} from "@pristine-ts/common";

/**
 * This Error is thrown when there's you try to decode a JWT in a request but the AuthorizationHeader is missing.
 */
export class JwtAuthorizationHeaderError extends LoggableError {
    /**
     * This Error is thrown when there's you try to decode a JWT in a request but the AuthorizationHeader is missing.
     * @param message The error message.
     * @param request The request that is missing the AuthorizationHeader.
     */
    public constructor(message: string, request: RequestInterface) {
        super(message, {
            request,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, JwtAuthorizationHeaderError.prototype);    }
}
