import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SQSClient, SendMessageCommand, SQSClientConfig, MessageAttributeValue} from "@aws-sdk/client-sqs";
import {SqsMessageSentConfirmationModel} from "../models/sqs-message-sent-confirmation.model";
import {SqsSendMessageError} from "../errors/sqs-send-message.error";
import {moduleScoped, tag} from "@pristine-ts/common";
import {AwsModuleKeyname} from "../aws.module.keyname";
import {SqsClientInterface} from "../interfaces/sqs-client.interface";
import {ClientOptionsInterface} from "../interfaces/client-options.interface";
import {SqsClientOptions} from "../options/sqs-client.options";

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
     * @param options The options to customize the request.
     */
    async send(queueUrl: string, body: string, options?: SqsClientOptions): Promise<SqsMessageSentConfirmationModel> {
        try {
            const client = this.getClient(options?.clientConfigs);

            const MessageAttributes: Record<string, MessageAttributeValue> = {};

            if(options?.eventGroupId) {
              MessageAttributes["eventGroupId"] = {
                DataType: "String",
                StringValue: options.eventGroupId,
              }
            }

            const command = new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: body,
                MessageGroupId: options?.messageGroupId,
                DelaySeconds: options?.delaySeconds,
                MessageDeduplicationId: options?.messageDeduplicationId,
                MessageAttributes,
            });

            this.logHandler.debug("SqsClient: Sending a message to the queue.", {
                highlights: {
                  queueUrl,
                  body,
                },
                eventId: options?.eventId,
                eventGroupId: options?.eventGroupId,
                extra: {
                    options
                }
            })

            const response = await client.send(command, options?.clientOptions);

            this.logHandler.debug("SqsClient: Message successfully sent to the queue.", {
              highlights: {
                queueUrl,
                body,
              },
              eventId: options?.eventId,
              eventGroupId: options?.eventGroupId,
              extra: {
                options
              }
            })

            return {
                messageId: response.MessageId,
            };

        } catch (error: any) {
            this.logHandler.error("SqsClient: There was an error sending the message to the queue.", {
              highlights: {
                queueUrl,
                body,
                errorMessage: error.message ?? "Unknown error",
              },
              eventId: options?.eventId,
              eventGroupId: options?.eventGroupId,
              extra: {
                options,
                error,
              }
            });

            throw new SqsSendMessageError(error, queueUrl, body, options?.messageGroupId, options?.delaySeconds);
        }
    }
}
