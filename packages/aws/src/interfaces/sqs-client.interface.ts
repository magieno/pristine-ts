import {SqsMessageSentConfirmationModel} from "../models/sqs-message-sent-confirmation.model";

export interface SqsClientInterface {
    send(queueUrl: string, body: string, messageGroupId?: string, delaySeconds?: number, endpoint?: string): Promise<SqsMessageSentConfirmationModel>;
}