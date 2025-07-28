import {ContextAwareInterface, IdentityInterface, Request} from "@pristine-ts/common";

/**
 * The Authenticator Interface defines what an authenticator should implement.
 * It extends the ContextAwareInterface.
 */
export interface AuthenticatorInterface extends ContextAwareInterface {

  /**
   * Authenticates the request by providing the identity making the request if it exists.
   * @param request The request to authenticate.
   * @returns {IdentityInterface | undefined} The Identity making the request if it exists
   */
  authenticate(request: Request): Promise<IdentityInterface | undefined>;
}
