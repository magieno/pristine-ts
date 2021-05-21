/**
 * This class defines a basic HttpError. In your code, feel free to throw an HttpError to have this error returned via HTTP.
 * If you throw this error when handling an Event, it won't be returned.
 */
export class HttpError extends Error {
    public constructor(public readonly httpStatus: number, readonly message: string, public readonly errors: any[] = []) {
        super(message);

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}
