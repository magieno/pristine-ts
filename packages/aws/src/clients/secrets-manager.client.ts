import {AwsModuleKeyname} from "../aws.module.keyname";
import {moduleScoped, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SecretsManagerClientInterface} from "../interfaces/secrets-manager-client.interface";
import {GetSecretValueCommand, SecretsManagerClient as AWSSecretsManagerClient} from "@aws-sdk/client-secrets-manager";
import {GetSecretSecretsManagerError} from "../errors/get-secret-secrets-manager.error";
import {ClientOptionsInterface} from "../interfaces/client-options.interface";

@tag("SecretsManagerClientInterface")
@moduleScoped(AwsModuleKeyname)
@injectable()
export class SecretsManagerClient implements SecretsManagerClientInterface {
    /**
     * The client to use to interact with AWS SES. It is a wrapper around the SESClient of @aws-sdk/client-ses.
     * @param logHandler The log handler used to output logs.
     * @param region The aws region for which the client will be used.
     */
    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.aws.region%") private readonly region: string,
    ) {
    }

    getClient(endpoint?: string): AWSSecretsManagerClient {
        return new AWSSecretsManagerClient({
            region: this.region,
            endpoint: endpoint ?? undefined,
        });
    }

    /**
     * This retrieves a secret from the secret manager
     *
     * @param secretName
     * @param options
     */
    async getSecret(secretName: string, options?: Partial<ClientOptionsInterface>): Promise<{[key in string]: string}> {
        const command: GetSecretValueCommand = new GetSecretValueCommand({
            SecretId: secretName,
        });

        const response = await this.getClient().send(command, {
            requestTimeout: options?.requestTimeout,
        });

        const secretString = response.SecretString;

        if(!secretString) {
            const message = `SecretsManagerClient: No value for this parameter: '${secretName}'.`;
            this.logHandler.error(message, {extra: {secretName}});

            throw new GetSecretSecretsManagerError(message);
        }

        try {
            return JSON.parse(secretString);
        } catch (e) {
            const message = `SecretsManagerClient: Couldn't parse the secret as a JSON object: '${secretName}'.`;
            this.logHandler.error(message, {extra: {secretName}});

            throw new GetSecretSecretsManagerError(message);
        }
    }

    /**
     * This retrieves a secret key from a secret from the secret manager
     *
     * @param secretName
     * @param key The key in the JSON object of the secret
     */
    async getSecretKey(secretName: string, key: string): Promise<string> {
        const secret = await this.getSecret(secretName);

        if (secret.hasOwnProperty(key) === false) {
            const message = `SecretsManagerClient: Cannot find jsonKey '${key}' in the secret: '${secretName}'.`;
            this.logHandler.error(message, {extra: {secretName, key}});
            throw new GetSecretSecretsManagerError(message);
        }

        return secret[key];
    }

}