import {PristineError} from "@pristine-ts/common";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";

/**
 * This Error is thrown when there's an error with the authenticator decorator.
 */
export class AuthenticatorDecoratorError extends PristineError {

  public constructor(message: string, authenticator: AuthenticatorInterface | Function, options: any, target: any,
                     propertyKey?: string,
                     descriptor?: PropertyDescriptor) {
    super(message, {details: {
      message,
      authenticator,
      options,
      target,
      propertyKey,
      descriptor,
    }});  }
}
