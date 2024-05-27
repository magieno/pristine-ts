import {AwsModuleKeyname} from "../aws.module.keyname";
import {moduleScoped, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SecretsManagerClientInterface} from "../interfaces/secrets-manager-client.interface";
import {GetSecretValueCommand, SecretsManagerClient as AWSSecretsManagerClient} from "@aws-sdk/client-secrets-manager";
import {GetSecretSecretsManagerError} from "../errors/get-secret-secrets-manager.error";
import {ClientOptionsInterface} from "../interfaces/client-options.interface";
import * as AWSXRay from "aws-xray-sdk";

@tag("SecretsManagerClientInterface")
@moduleScoped(AwsModuleKeyname)
@injectable()
export class SecretsManagerClient implements SecretsManagerClientInterface {
    /**
     * The client to use to interact with AWS SES. It is a wrapper around the SESClient of @aws-sdk/client-ses.
     * @param logHandler The log handler used to output logs.
     * @param region The aws region for which the client will be used.
     * @param isTracingActive Whether or not the service tracing is activated.
     */
    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.aws.region%") private readonly region: string,
        @inject("%pristine.aws.serviceTracing.isActive") public isTracingActive: boolean,
    ) {
    }

    getClient(endpoint?: string): AWSSecretsManagerClient {
        if (this.isTracingActive === true) {
            return AWSXRay.captureAWSv3Client(
                new AWSSecretsManagerClient({
                    region: this.region,
                    endpoint: endpoint ?? undefined,
                }));
        }

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
            const message = `No value for this parameter: '${secretName}'.`;
            this.logHandler.error(message, {secretName});

            throw new GetSecretSecretsManagerError(message);
        }

        try {
            return JSON.parse(secretString);
        } catch (e) {
            const message = `Couldn't parse the secret as a JSON object: '${secretName}'.`;
            this.logHandler.error(message, {secretName});

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
            const message = `Cannot find jsonKey '${key}' in the secret: '${secretName}'.`;
            this.logHandler.error(message, {secretName, key});
            throw new GetSecretSecretsManagerError(message);
        }

        return secret[key];
    }

}