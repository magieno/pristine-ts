import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SQSClient, ReceiveMessageCommand, SendMessageCommand} from "@aws-sdk/client-sqs";
import {SqsMessageSentConfirmationModel} from "../models/sqs-message-sent-confirmation.model";
import {SqsSendMessageError} from "../errors/sqs-send-message.error";

@injectable()
export class SqsClient {
    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.aws.region%") private readonly region: string,
    ) {
    }

    /**
     * Sends a message to the specified Queue URL.
     * @param queueUrl
     * @param body
     * @param messageGroupId
     * @param delaySeconds
     * @param endpoint
     */
    send(queueUrl: string, body: string, messageGroupId?: string, delaySeconds?: number, endpoint?: string): Promise<SqsMessageSentConfirmationModel> {
        return new Promise<SqsMessageSentConfirmationModel>(async (resolve, reject) => {
            try {
                const client = new SQSClient({
                    region: this.region,
                    endpoint: endpoint ?? undefined,
                })

                const command = new SendMessageCommand({
                    QueueUrl: queueUrl,
                    MessageBody: body,
                    MessageGroupId: messageGroupId,
                    DelaySeconds: delaySeconds,
                });

                this.logHandler.debug("Sending a message to the queue", {
                    queueUrl,
                    body,
                    messageGroupId,
                    delaySeconds,
                })

                const response = await client.send(command);

                this.logHandler.debug("Message succesfully sent to the queue", {
                    queueUrl,
                    body,
                    messageGroupId,
                    delaySeconds,
                    response,
                })

                return resolve({
                    messageId: response.MessageId,
                });

            }catch (error) {
                this.logHandler.error("There was an error sending the message to the queue", {
                    error,
                    queueUrl,
                    body,
                    messageGroupId,
                    delaySeconds,
                });

                return reject(new SqsSendMessageError());
            }
        })
    }
}
