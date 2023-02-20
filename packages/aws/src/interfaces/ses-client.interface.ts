import {SESClient} from "@aws-sdk/client-ses";
import {EmailModel} from "../models/email.model";
import {SesMessageSentConfirmationModel} from "../models/ses-message-sent-confirmation.model";

/**
 * The S3Client Interface defines the methods that an S3 client must implement.
 * When injecting the S3 client the 'S3ClientInterface' tag should be used.
 */
export interface SesClientInterface {
    /**
     * Returns the instantiated SQSClient from the @aws-sdk/client-sqs library.
     * @param endpoint The endpoint for which the SQS client is created.
     */
    getClient(endpoint?: string): SESClient;

    /**
     * Sends a message to the specified Queue URL.
     * @param email
     * @param endpoint
     */
    send(email: EmailModel, endpoint?: string): Promise<SesMessageSentConfirmationModel>

    sendTemplate(email: EmailModel, templateName: string, templateData: {[key in string]: string}, endpoint?: string): Promise<SesMessageSentConfirmationModel>
}
