import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SQSClient, SendMessageCommand} from "@aws-sdk/client-sqs";
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
     * @param endpoint The endpoint for which the SQS client is created.
     */
    public getClient(endpoint?: string): SQSClient {
        return new SQSClient({
            region: this.region,
            endpoint: endpoint ?? undefined,
        });
    }

    /**
     * Sends a message to the specified Queue URL.
     * @param queueUrl The queue url where to send the message.
     * @param body The body of the message to send in the queue.
     * @param messageGroupId The message group id for FIFO queues.
     * @param delaySeconds The length of time, in seconds, for which to delay a specific message.
     * @param endpoint The endpoint for SQS.
     * @param messageDeduplicationId The unique id used by Amazon SQS in Fifo queues to avoid treating a message twice.
     * @param options
     */
    async send(queueUrl: string, body: string, messageGroupId?: string, delaySeconds?: number, endpoint?: string, messageDeduplicationId?: string, options?: Partial<ClientOptionsInterface>): Promise<SqsMessageSentConfirmationModel> {
        try {
            const client = this.getClient(endpoint);

            const command = new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: body,
                MessageGroupId: messageGroupId,
                DelaySeconds: delaySeconds,
                MessageDeduplicationId: messageDeduplicationId,
            });

            this.logHandler.debug("Sending a message to the queue", {
                queueUrl,
                body,
                messageGroupId,
                delaySeconds,
                messageDeduplicationId,
            }, AwsModuleKeyname)

            const response = await client.send(command, options);

            this.logHandler.debug("Message successfully sent to the queue", {
                queueUrl,
                body,
                messageGroupId,
                delaySeconds,
                response,
                messageDeduplicationId
            }, AwsModuleKeyname)

            return {
                messageId: response.MessageId,
            };

        } catch (error) {
            this.logHandler.error("There was an error sending the message to the queue", {
                error,
                queueUrl,
                body,
                messageGroupId,
                delaySeconds,
                messageDeduplicationId,
            }, AwsModuleKeyname);

            throw new SqsSendMessageError(error, queueUrl, body, messageGroupId, delaySeconds);
        }
    }
}
