import {SESClient} from "@aws-sdk/client-ses";
import {EmailModel} from "../models/email.model";
import {SesMessageSentConfirmationModel} from "../models/ses-message-sent-confirmation.model";

/**
 * The SESClient Interface defines the methods that an SES client must implement.
 * When injecting the SES client the 'SesClientInterface' tag should be used.
 */
export interface SesClientInterface {
    /**
     * Returns the instantiated SESClient from the @aws-sdk/client-sqs library.
     * @param endpoint The endpoint for which the SES client is created.
     */
    getClient(endpoint?: string): SESClient;

    /**
     * This sends an email.
     *
     * @param email
     * @param endpoint
     */
    send(email: EmailModel, endpoint?: string): Promise<SesMessageSentConfirmationModel>

    /**
     * This sends an email with the specified template and template Data.
     * @param email
     * @param templateName
     * @param templateData
     * @param endpoint
     */
    sendTemplate(email: EmailModel, templateName: string, templateData: {[key in string]: string}, endpoint?: string): Promise<SesMessageSentConfirmationModel>
}
