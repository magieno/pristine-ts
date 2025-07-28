import {HttpError} from "./http.error";

/**
 * This Error represents a 403 error.
 */
export class ForbiddenHttpError extends HttpError {
  public constructor(readonly message: string) {
    super(403, message);

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, ForbiddenHttpError.prototype);
  }
}