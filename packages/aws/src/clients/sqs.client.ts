import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SQSClient, SendMessageCommand, SQSClientConfig} from "@aws-sdk/client-sqs";
import {SqsMessageSentConfirmationModel} from "../models/sqs-message-sent-confirmation.model";
import {SqsSendMessageError} from "../errors/sqs-send-message.error";
import {moduleScoped, tag} from "@pristine-ts/common";
import {AwsModuleKeyname} from "../aws.module.keyname";
import {SqsClientInterface} from "../interfaces/sqs-client.interface";
import {ClientOptionsInterface} from "../interfaces/client-options.interface";

/**
 * The client to use to interact with AWS SQS. It is a wrapper around the SQSClient of @aws-sdk/client-sqs.
 * It is tagged so it can be injected using SqsClientInterface.
 */
@tag("SqsClientInterface")
@moduleScoped(AwsModuleKeyname)
@injectable()
export class SqsClient implements SqsClientInterface {

    /**
     * The client to use to interact with AWS SQS. It is a wrapper around the SQSClient of @aws-sdk/client-sqs.
     * @param logHandler The log handler used to output logs.
     * @param region The aws region for which the client will be used.
     */
    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.aws.region%") private readonly region: string,
    ) {
    }

    /**
     * Returns the instantiated SQSClient from the @aws-sdk/client-sqs library.
     * @param configs The configs for which the SQS client is created.
     */
    public getClient(configs?: Partial<SQSClientConfig>): SQSClient {
        return new SQSClient({
            region: this.region,
            ...configs
        });
    }

    /**
     * Sends a message to the specified Queue URL.
     * @param queueUrl The queue url where to send the message.
     * @param body The body of the message to send in the queue.
     * @param messageGroupId The message group id for FIFO queues.
     * @param delaySeconds The length of time, in seconds, for which to delay a specific message.
     * @param messageDeduplicationId The unique id used by Amazon SQS in Fifo queues to avoid treating a message twice.
     * @param options
     * @param configs The configs for which the SQS client is created.
     */
    async send(queueUrl: string, body: string, messageGroupId?: string, delaySeconds?: number, messageDeduplicationId?: string, options?: Partial<ClientOptionsInterface>, configs?: Partial<SQSClientConfig>): Promise<SqsMessageSentConfirmationModel> {
        try {
            const client = this.getClient(configs);

            const command = new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: body,
                MessageGroupId: messageGroupId,
                DelaySeconds: delaySeconds,
                MessageDeduplicationId: messageDeduplicationId,
            });

            this.logHandler.debug("SqsClient: Sending a message to the queue.", {
                extra: {
                    queueUrl,
                    body,
                    messageGroupId,
                    delaySeconds,
                    messageDeduplicationId,
                }
            }, AwsModuleKeyname)

            const response = await client.send(command, options);

            this.logHandler.debug("SqsClient: Message successfully sent to the queue.", {
                extra: {
                    queueUrl,
                    body,
                    messageGroupId,
                    delaySeconds,
                    response,
                    messageDeduplicationId
                }
            }, AwsModuleKeyname)

            return {
                messageId: response.MessageId,
            };

        } catch (error) {
            this.logHandler.error("SqsClient: There was an error sending the message to the queue.", {
                extra: {
                    error,
                    queueUrl,
                    body,
                    messageGroupId,
                    delaySeconds,
                    messageDeduplicationId,
                }
            }, AwsModuleKeyname);

            throw new SqsSendMessageError(error, queueUrl, body, messageGroupId, delaySeconds);
        }
    }
}
