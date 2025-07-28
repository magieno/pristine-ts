import {AuthenticatorInterface} from "./authenticator.interface";

/**
 * The Authenticator Context Interface defines what the context of an authenticator should have.
 */
export interface AuthenticatorContextInterface {
  /**
   * The name of the constructor of the authenticator.
   */
  constructorName: string;

  /**
   * The actual authenticator.
   */
  authenticator: AuthenticatorInterface | Function

  /**
   * The options to be used by the authenticator.
   */
  options: any;
}
