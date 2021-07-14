import {HttpError} from "@pristine-ts/networking";

export class StripeAuthenticationError extends HttpError {
    public constructor(readonly httpStatus: number, readonly message: string, readonly errors?: any[] | undefined) {
        super(httpStatus, message, errors);

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, StripeAuthenticationError.prototype);
    }
}
