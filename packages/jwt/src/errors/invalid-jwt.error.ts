import {PristineError, Request} from "@pristine-ts/common";

/**
 * This Error is thrown when you try to decode a JWT but the token is invalid.
 */
export class InvalidJwtError extends PristineError {

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
    super(message, {details: {
      request,
      previousError,
      token,
      algorithm,
      publicKey,
    }});  }
}
