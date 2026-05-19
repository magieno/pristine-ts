import {ExitCode, PristineError, PristineErrorKind} from "@pristine-ts/common";
import {StripeErrorCode} from "./stripe-error-code.enum";

/**
 * This Error represents an error when authenticating with Stripe. Wraps the underlying
 * Stripe API response status in the `httpStatus` slot so the framework's
 * `HttpErrorResponder` produces a meaningful response automatically.
 */
export class StripeAuthenticationError extends PristineError {
  public constructor(httpStatus: number, message: string, errors?: any[]) {
    super(message, {
      code: StripeErrorCode.StripeAuthenticationFailed,
      httpStatus,
      exitCode: ExitCode.Error,
      kind: PristineErrorKind.UserError,
      details: errors ? {errors} : undefined,
    });
  }
}
