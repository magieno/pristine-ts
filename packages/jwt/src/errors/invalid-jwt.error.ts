import {LoggableError, Request} from "@pristine-ts/common";

/**
 * This Error is thrown when you try to decode a JWT but the token is invalid.
 */
export class InvalidJwtError extends LoggableError {

  /**
   * This Error is thrown when you try to decode a JWT but the token is invalid.
   * @param message The error message to show.
   * @param previousError The previous error.
   * @param request The request that contained the JWT.
   * @param token The actual JWT.
   * @param algorithm The algorithm used to decode the JWT.
   * @param publicKey The public key used to decode the JWT.
   */
  public constructor(message: string, previousError: Error, request: Request, token: string, algorithm: string, publicKey: string) {
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
    Object.setPrototypeOf(this, InvalidJwtError.prototype);
  }
}
