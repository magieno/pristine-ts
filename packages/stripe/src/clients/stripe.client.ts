import {inject, injectable, injectAll} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {tag} from "@pristine-ts/common";
import {StripeClientInterface} from "../interfaces/stripe-client.interface";
import {StripeAuthenticationError} from "../errors/stripe-authentication.error";
import {StripeModuleKeyname} from "../stripe.module.keyname";
import Stripe from "stripe";
import {Request} from "@pristine-ts/common";
import {CredentialsProviderInterface} from "../interfaces/credentials-provider.interface";
import {InvalidCredentialProviderUniqueNameError} from "../errors/invalid-credential-provider-unique-name.error";
import {CredentialProviderNotFoundError} from "../errors/credential-provider-not-found.error";

/**
 * The client to use to interact with Stripe. It is a wrapper around the Stripe library.
 * It is tagged so it can be injected using StripeClientInterface.
 */
@tag("StripeClientInterface")
@injectable()
export class StripeClient implements StripeClientInterface{

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
        @inject(`%${StripeModuleKeyname}.credential_provider.name%`) private readonly credentialProviderUniqueName: string,
        @injectAll("CredentialsProviderInterface") private readonly credentialProviders: CredentialsProviderInterface[],
    ) {
    }

    private getCredentialProvider(): CredentialsProviderInterface {
        if(!this.credentialProviderUniqueName) {
            this.logHandler.error(`The configuration '${StripeModuleKeyname}.credential_provider.name' contains an invalid unique name: '${this.credentialProviderUniqueName}'}`)
            throw new InvalidCredentialProviderUniqueNameError(this.credentialProviderUniqueName);
        }

        const filteredProviders = this.credentialProviders.filter(credentialProvider => credentialProvider.getUniqueName() === this.credentialProviderUniqueName);

        if(filteredProviders.length === 0) {
            this.logHandler.error(`There is no credential provier registered with the configuration name '${StripeModuleKeyname}.credential_provider.name' with unique name: '${this.credentialProviderUniqueName}'.`)
            throw new CredentialProviderNotFoundError(this.credentialProviderUniqueName);
        }

        if(filteredProviders.length > 1) {
            this.logHandler.warning(`There is more than on credential provider with the configuration name '${StripeModuleKeyname}.credential_provider.name' with unique name: '${this.credentialProviderUniqueName}'. The first one will be selected.`);
        }

        return filteredProviders[0];
    }

    /**
     * Returns the Stripe client of the Stripe library with the api version '2023-10-16'
     */
    getStripeClient(): Stripe {
        // Find the credential provider to use and then get the StripeApi Key
        const credentialProvider = this.getCredentialProvider();

        return this.client = this.client ?? new Stripe(credentialProvider.getStripeApiKey(), {
            apiVersion: '2023-10-16',
        });
    }

    /**
     * Verifies the signature of a webhook call made to an endpoint.
     * @param request The whole request received to the endpoint.
     * @param stripeSigningEndpointSecret The endpoint secret that stripe uses to sign the request.
     */
    async verifySignature(request: Request, stripeSigningEndpointSecret: string): Promise<Stripe.Event> {
        if(!request.headers || !request.headers['stripe-signature']) {
            throw new StripeAuthenticationError(400, 'Missing headers for stripe signature');
        }

        const stripeSignature = request.headers['stripe-signature'];

        try {
            return this.getStripeClient().webhooks.constructEvent(request.rawBody, stripeSignature, stripeSigningEndpointSecret);
        } catch (err) {
            this.logHandler.error("Error with stripe signature", {error: err, request}, StripeModuleKeyname);
            throw new StripeAuthenticationError(400, 'Raw body does not match stripe signature');
        }
    }
}
