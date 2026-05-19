import {PristineError, Request} from "@pristine-ts/common";

/**
 * This Error is thrown when there's you try to decode a JWT in a request but the AuthorizationHeader is missing.
 */
export class JwtAuthorizationHeaderError extends PristineError {
  /**
   * This Error is thrown when there's you try to decode a JWT in a request but the AuthorizationHeader is missing.
   * @param message The error message.
   * @param request The request that is missing the AuthorizationHeader.
   */
  public constructor(message: string, request: Request) {
    super(message, {details: {
      request,
    }});  }
}
