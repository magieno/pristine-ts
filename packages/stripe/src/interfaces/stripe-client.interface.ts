import Stripe from "stripe";
import {RequestInterface} from "@pristine-ts/common";

export interface StripeClientInterface {

    getStripeClient(): Stripe;

    verifySignature(request: RequestInterface): Promise<Stripe.Event>;
}
