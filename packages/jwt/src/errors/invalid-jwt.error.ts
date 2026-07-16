import {PristineError, PristineErrorCode, Request} from "@pristine-ts/common";

/**
 * This Error is thrown when you try to decode a JWT but the token is invalid.
 *
 * An invalid (missing signature, malformed, wrong issuer, …) token means the caller is
 * not authenticated, so this surfaces as a `401 UNAUTHORIZED` — a client should send the
 * user to login. An *expired* token is handled separately as a `TokenExpiredError`
 * (`401 TOKEN_EXPIRED`) so the client can attempt a refresh instead.
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
    super(message, {
      code: PristineErrorCode.Unauthorized,
      httpStatus: 401,
      details: {
        request,
        previousError,
        token,
        algorithm,
        publicKey,
      },
    });  }
}
