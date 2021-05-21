import {HttpError} from "./http.error";

/**
 * This Error represents a 400 error.
 */
export class BadRequestHttpError extends HttpError {
    public constructor(readonly message: string, readonly errors: any[]) {
        super(400, message, errors);

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, BadRequestHttpError.prototype);
    }
}
