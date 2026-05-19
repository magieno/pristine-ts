import {PristineError} from "@pristine-ts/common";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";

/**
 * This Error is thrown when there's an error that happens when the authenticator are being initialized
 */
export class AuthenticatorInstantiationError extends PristineError {
  public previousError?: Error;

  public constructor(message: string, instantiatedAuthenticator: AuthenticatorInterface | Function, authenticatorContext: any) {
    super(message, {details: {
      instantiatedAuthenticator,
      authenticatorContext,
    }});  }
}
