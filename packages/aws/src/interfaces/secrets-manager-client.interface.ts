import {SESClient} from "@aws-sdk/client-ses";
import {EmailModel} from "../models/email.model";
import {SesMessageSentConfirmationModel} from "../models/ses-message-sent-confirmation.model";

/**
 * The SecretsManager Interface defines the methods that a Secrets Manager client must implement.
 * When injecting the SecretsManager client the 'SecretsManagerClientInterface' tag should be used.
 */
export interface SecretsManagerClientInterface {
    /**
     * Returns the instantiated SecretsManagerClientInterface from the @aws-sdk/client-secrets-manager library.
     * @param endpoint The endpoint for which the Secrets Manager client is created.
     */
    getClient(endpoint?: string): SESClient;

    /**
     * This retrieves a secret from the secret manager
     *
     * @param secretName
     */
    getSecret(secretName: string): Promise<{[key in string]: string}>

    /**
     * This retrieves a secret key from a secret from the secret manager
     *
     * @param secretName
     * @param key The key in the JSON object of the secret
     */
    getSecretKey(secretName: string, key: string): Promise<string>
}
