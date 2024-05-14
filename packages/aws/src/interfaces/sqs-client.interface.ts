import {SqsMessageSentConfirmationModel} from "../models/sqs-message-sent-confirmation.model";
import {SQSClient} from "@aws-sdk/client-sqs";
import {ClientOptionsInterface} from "./client-options.interface";

/**
 * The S3Client Interface defines the methods that an S3 client must implement.
 * When injecting the S3 client the 'S3ClientInterface' tag should be used.
 */
export interface SqsClientInterface {
    /**
     * Returns the instantiated SQSClient from the @aws-sdk/client-sqs library.
     * @param endpoint The endpoint for which the SQS client is created.
     */
    getClient(endpoint?: string): SQSClient;

    /**
     * Sends a message to the specified Queue URL.
     * @param queueUrl The queue url where to send the message.
     * @param body The body of the message to send in the queue.
     * @param messageGroupId The message group id for FIFO queues.
     * @param delaySeconds The length of time, in seconds, for which to delay a specific message.
     * @param endpoint The endpoint for SQS.
     * @param messageDeduplicationId
     * @param options
     */
    send(queueUrl: string, body: string, messageGroupId?: string, delaySeconds?: number, endpoint?: string, messageDeduplicationId?: string, options?: Partial<ClientOptionsInterface>): Promise<SqsMessageSentConfirmationModel>;
}
