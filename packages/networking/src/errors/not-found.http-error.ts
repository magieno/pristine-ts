import {HttpError} from "./http.error";

/**
 * This Error represents a 404 error.
 */
export class NotFoundHttpError extends HttpError {
  public constructor(readonly message: string) {
    super(404, message);

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, NotFoundHttpError.prototype);
  }
}