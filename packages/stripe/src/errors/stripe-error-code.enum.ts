/**
 * Error-code catalog owned by `@pristine-ts/stripe`. Surfaced via `PristineErrorOptions.code`
 * (typed `PristineErrorCode | string`, so any enum value is accepted).
 *
 * Codes here describe failures from the Stripe client wrapped by this module.
 */
export enum StripeErrorCode {
  StripeAuthenticationFailed = "STRIPE_AUTHENTICATION_FAILED",
}
