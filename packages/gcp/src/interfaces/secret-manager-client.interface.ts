import {SecretManagerServiceClient} from "@google-cloud/secret-manager";
import {GcpClientOptionsInterface} from "./client-options.interface";

export interface SecretManagerClientInterface {
  getClient(): SecretManagerServiceClient;

  getSecret(secretName: string, options?: Partial<GcpClientOptionsInterface>): Promise<{ [key: string]: string }>;

  getSecretKey(secretName: string, key: string, options?: Partial<GcpClientOptionsInterface>): Promise<string>;
}
