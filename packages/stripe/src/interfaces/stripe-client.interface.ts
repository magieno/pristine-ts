import Stripe from "stripe";
import {Request} from "@pristine-ts/common";

/**
 * This interface represents the Stripe client and can be used to inject it. It facilitates mocking and testing.
 */
export interface StripeClientInterface {
  /**
   * Returns the Stripe client of the Stripe library with the api version '2020-08-27'
   */
  getStripeClient(): Stripe;

  /**
   * Verifies the signature of a webhook call made to an endpoint.
   * @param request The whole request received to the endpoint.
   * @param stripeSigningEndpointSecret The endpoint secret that stripe uses to sign the request.
   */
  verifySignature(request: Request, stripeSigningEndpointSecret: string): Promise<Stripe.Event>;
}
