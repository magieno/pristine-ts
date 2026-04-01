import {ClientOptionsInterface} from "./client-options.interface";
import {SecretsManagerClient as AWSSecretsManagerClient} from "@aws-sdk/client-secrets-manager/dist-types/SecretsManagerClient";

/**
 * The SecretsManager Interface defines the methods that a Secrets Manager client must implement.
 * When injecting the SecretsManager client the 'SecretsManagerClientInterface' tag should be used.
 */
export interface SecretsManagerClientInterface {
  /**
   * Returns the instantiated SecretsManagerClientInterface from the @aws-sdk/client-secrets-manager library.
   * @param endpoint The endpoint for which the Secrets Manager client is created.
   */
  getClient(endpoint?: string): AWSSecretsManagerClient;

  /**
   * This retrieves a secret from the secret manager
   *
   * @param secretName
   * @param options
   */
  getSecret(secretName: string, options?: Partial<ClientOptionsInterface>): Promise<{ [key in string]: string }>

  /**
   * This retrieves a secret key from a secret from the secret manager
   *
   * @param secretName
   * @param key The key in the JSON object of the secret
   * @param options
   */
  getSecretKey(secretName: string, key: string, options?: Partial<ClientOptionsInterface>): Promise<string>
}
