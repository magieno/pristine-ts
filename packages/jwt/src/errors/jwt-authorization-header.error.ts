import {PristineError, PristineErrorCode, Request} from "@pristine-ts/common";

/**
 * This Error is thrown when there's you try to decode a JWT in a request but the AuthorizationHeader is missing.
 *
 * A missing (or malformed) Authorization header means the caller never presented a
 * token, so this surfaces as a `401 UNAUTHORIZED` — the client should send the user to
 * login rather than attempt a token refresh.
 */
export class JwtAuthorizationHeaderError extends PristineError {
  /**
   * This Error is thrown when there's you try to decode a JWT in a request but the AuthorizationHeader is missing.
   * @param message The error message.
   * @param request The request that is missing the AuthorizationHeader.
   */
  public constructor(message: string, request: Request) {
    super(message, {
      code: PristineErrorCode.Unauthorized,
      httpStatus: 401,
      details: {
        request,
      },
    });  }
}
