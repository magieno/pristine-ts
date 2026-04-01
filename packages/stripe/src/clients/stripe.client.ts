import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {Request, tag} from "@pristine-ts/common";
import {StripeClientInterface} from "../interfaces/stripe-client.interface";
import {StripeAuthenticationError} from "../errors/stripe-authentication.error";
import {StripeModuleKeyname} from "../stripe.module.keyname";
import Stripe from "stripe";

/**
 * The client to use to interact with Stripe. It is a wrapper around the Stripe library.
 * It is tagged so it can be injected using StripeClientInterface.
 */
@tag("StripeClientInterface")
@injectable()
export class StripeClient implements StripeClientInterface {

  /**
   * The client from the Stripe library.
   * @private
   */
  private client?: Stripe;

  /**
   * The client to use to interact with Stripe. It is a wrapper around the Stripe library.
   * It is tagged so it can be injected using StripeClientInterface.
   * @param logHandler The log handler to output logs.
   * @param stripeApiKey The api key to use when contacting Stripe.
   */
  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @inject(`%${StripeModuleKeyname}.stripeApiKey%`) private readonly stripeApiKey: string,
  ) {
  }

  /**
   * Returns the Stripe client of the Stripe library with the api version '2023-10-16'
   */
  getStripeClient(): Stripe {
    return this.client = this.client ?? new Stripe(this.stripeApiKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Verifies the signature of a webhook call made to an endpoint.
   * @param request The whole request received to the endpoint.
   * @param stripeSigningEndpointSecret The endpoint secret that stripe uses to sign the request.
   */
  async verifySignature(request: Request, stripeSigningEndpointSecret: string): Promise<Stripe.Event> {
    if (!request.headers || !request.headers['stripe-signature']) {
      throw new StripeAuthenticationError(400, 'Missing headers for stripe signature');
    }

    const stripeSignature = request.headers['stripe-signature'];

    try {
      return this.getStripeClient().webhooks.constructEvent(request.rawBody, stripeSignature, stripeSigningEndpointSecret);
    } catch (error: any) {
      this.logHandler.error("StripeClient: Error with stripe signature.", {
        eventId: request.id,
        highlights: {
          errorMessage: error.message ?? "Unknown error",
          requestUrl: `${request.httpMethod} ${request.url}`,
        },
        extra: {
          request,
          error,
        }
      });
      throw new StripeAuthenticationError(400, 'Raw body does not match stripe signature');
    }
  }
}
