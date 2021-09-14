import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SQSClient, ReceiveMessageCommand, SendMessageCommand} from "@aws-sdk/client-sqs";
import {SqsMessageSentConfirmationModel} from "../models/sqs-message-sent-confirmation.model";
import {SqsSendMessageError} from "../errors/sqs-send-message.error";
import {moduleScoped, tag} from "@pristine-ts/common";
import {AwsModuleKeyname} from "../aws.module.keyname";
import {SqsClientInterface} from "../interfaces/sqs-client.interface";

@tag("SqsClientInterface")
@moduleScoped(AwsModuleKeyname)
@injectable()
export class SqsClient implements SqsClientInterface {
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
                }, AwsModuleKeyname)

                const response = await client.send(command);

                this.logHandler.debug("Message succesfully sent to the queue", {
                    queueUrl,
                    body,
                    messageGroupId,
                    delaySeconds,
                    response,
                }, AwsModuleKeyname)

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
                }, AwsModuleKeyname);

                return reject(new SqsSendMessageError());
            }
        })
    }
}
