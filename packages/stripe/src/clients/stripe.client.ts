import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {RequestInterface, tag} from "@pristine-ts/common";
import {StripeClientInterface} from "../interfaces/stripe-client.interface";
import {StripeAuthenticationError} from "../errors/stripe-authentication.error";
import {StripeModuleKeyname} from "../stripe.module.keyname";
import Stripe from "stripe";

@tag("StripeClientInterface")
@injectable()
export class StripeClient implements StripeClientInterface{

    client: Stripe;

    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject(`%${StripeModuleKeyname}.stripeApiKey%`) private readonly stripeApiKey: string,
    ) {
    }

    /**
     * This method returns the Stripe client of the Stripe library with the api version '2020-08-27'
     */
    getStripeClient(): Stripe {
        return this.client ?? new Stripe(this.stripeApiKey, {
            apiVersion: '2020-08-27',
        });
    }

    /**
     * This method verifies the signature of a webhook call made to an endpoint.
     * @param request The whole request received to the endpoint.
     * @param stripeSigningEndpointSecret The endpoint secret that stripe uses to sign the request.
     */
    async verifySignature(request: RequestInterface, stripeSigningEndpointSecret: string): Promise<Stripe.Event> {
        if(!request.headers || !request.headers['stripe-signature']) {
            throw new StripeAuthenticationError(400, 'Missing headers for stripe signature');
        }

        const stripeSignature = request.headers['stripe-signature'];

        try {
            return this.getStripeClient().webhooks.constructEvent(request.rawBody, stripeSignature, stripeSigningEndpointSecret);
        } catch (err) {
            this.logHandler.error("Error with stripe signature", {error: err, request});
            throw new StripeAuthenticationError(400, 'Raw body does not match stripe signature');
        }
    }
}
