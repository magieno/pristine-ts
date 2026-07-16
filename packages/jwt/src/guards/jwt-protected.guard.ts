import {inject, injectable} from "tsyringe";
import {JwtManagerInterface} from "../interfaces/jwt-manager.interface";
import {IdentityInterface, Request, traced} from "@pristine-ts/common";
import {GuardContextInterface, GuardInterface} from "@pristine-ts/security";

/**
 * This guard is used to verify that a route can only be accessed when a request has a valid JWT.
 */
@injectable()
export class JwtProtectedGuard implements GuardInterface {
  public keyname = "jwt.protected";
  public guardContext?: GuardContextInterface

  constructor(@inject("JwtManagerInterface") private readonly jwtManager: JwtManagerInterface) {
  }

  /**
   * Verifies if the JWT is valid and authorizes access if it is.
   *
   * On failure it does NOT swallow the error into a `false`: it propagates the typed error
   * raised by the `JwtManager` (a `TokenExpiredError` → 401 TOKEN_EXPIRED, an
   * `InvalidJwtError`/`JwtAuthorizationHeaderError` → 401 UNAUTHORIZED). The
   * `AuthorizerManager` re-throws those typed auth errors so the client receives the
   * precise code and can tell "refresh the token" from "log in" — a bare `false` would
   * collapse every case into an indistinguishable 403.
   * @param request
   * @param identity
   */
  @traced()
  isAuthorized(request: Request, identity?: IdentityInterface): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.jwtManager.validateAndDecode(request)
        .then(value => resolve(true))
        .catch(reason => reject(reason));
    });
  }

  /**
   * Sets the context for the guard.
   * @param context
   */
  setContext(context: any): Promise<void> {
    this.guardContext = context;

    return Promise.resolve();
  }
}
