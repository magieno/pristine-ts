import {PristineError} from "@pristine-ts/common";
import {Kernel} from "../kernel";

/**
 * This Error is thrown when there's an error that happens while trying to register a Provider registration.
 */
export class ProviderRegistrationError extends PristineError {

  public constructor(message: string, providerRegistration: any, kernel: Kernel) {
    super(message, {details: {
      providerRegistration,
      kernel,
    }});  }
}
