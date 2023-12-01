export interface CredentialsProviderInterface {
    getStripeApiKey(): string;

    getUniqueName(): string
}