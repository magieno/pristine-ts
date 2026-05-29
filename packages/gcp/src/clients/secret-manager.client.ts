import {inject, injectable} from "tsyringe";
import {injectConfig, moduleScoped, tag, traced} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";
import {GcpModuleKeyname} from "../gcp.module.keyname";
import {GcpConfigurationKeys} from "../gcp.configuration-keys";
import {SecretManagerClientInterface} from "../interfaces/secret-manager-client.interface";
import {GcpClientOptionsInterface} from "../interfaces/client-options.interface";
import {GetSecretError} from "../errors/get-secret.error";

/**
 * Client for Google Cloud Secret Manager. Mirrors `SecretsManagerClient`.
 *
 * `secretName` accepts either a bare secret id (e.g. `"my-secret"`, in which case the
 * latest version of the secret in the configured project is fetched) or a fully
 * qualified version resource name
 * (`"projects/p/secrets/my-secret/versions/latest"`).
 */
@tag("SecretManagerClientInterface")
@moduleScoped(GcpModuleKeyname)
@injectable()
export class SecretManagerClient implements SecretManagerClientInterface {
  private client?: SecretManagerServiceClient;

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @injectConfig(GcpConfigurationKeys.ProjectId) private readonly projectId: string,
  ) {
  }

  getClient(): SecretManagerServiceClient {
    return this.client = this.client ?? new SecretManagerServiceClient();
  }

  private toVersionResourceName(secretName: string): string {
    if (secretName.startsWith("projects/")) {
      return secretName;
    }
    return `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
  }

  @traced()
  async getSecret(secretName: string, options?: Partial<GcpClientOptionsInterface>): Promise<{ [key: string]: string }> {
    const name = this.toVersionResourceName(secretName);
    try {
      const [version] = await this.getClient().accessSecretVersion({name});
      const payload = version.payload?.data;
      if (!payload) {
        const message = `SecretManagerClient: No value for this parameter: '${secretName}'.`;
        this.logHandler.error(message, {extra: {secretName}});
        throw new GetSecretError(message);
      }
      const secretString = Buffer.isBuffer(payload) ? payload.toString("utf-8") : Buffer.from(payload).toString("utf-8");
      try {
        return JSON.parse(secretString);
      } catch (e) {
        const message = `SecretManagerClient: Couldn't parse the secret as a JSON object: '${secretName}'.`;
        this.logHandler.error(message, {extra: {secretName}});
        throw new GetSecretError(message);
      }
    } catch (e) {
      if (e instanceof GetSecretError) {
        throw e;
      }
      this.logHandler.error("SecretManagerClient: Error accessing secret.", {extra: {error: e, secretName}});
      throw new GetSecretError(`SecretManagerClient: Error accessing secret '${secretName}': ${(e as Error).message}`);
    }
  }

  @traced()
  async getSecretKey(secretName: string, key: string, options?: Partial<GcpClientOptionsInterface>): Promise<string> {
    const secret = await this.getSecret(secretName, options);
    if (secret.hasOwnProperty(key) === false) {
      const message = `SecretManagerClient: Cannot find jsonKey '${key}' in the secret: '${secretName}'.`;
      this.logHandler.error(message, {extra: {secretName, key}});
      throw new GetSecretError(message);
    }
    return secret[key];
  }
}
