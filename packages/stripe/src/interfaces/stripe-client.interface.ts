import Stripe from "stripe";
import {RequestInterface} from "@pristine-ts/common";

export interface StripeClientInterface {

    getStripeClient(): Stripe;

    verifySignature(request: RequestInterface, stripeSigningEndpointSecret: string): Promise<Stripe.Event>;
}
