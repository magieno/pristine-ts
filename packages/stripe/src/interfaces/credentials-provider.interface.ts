export interface CredentialsProviderInterface {
    /**
     * This method returns the Stripe API Key.
     */
    getStripeApiKey(): string;

    /**
     * This method returns a unique string uniquely identifying the Credential Provider.
     */
    getUniqueName(): string
}