import {AwsModuleKeyname} from "../aws.module.keyname";
import {moduleScoped, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {SesClientInterface} from "../interfaces/ses-client.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {
    SendBulkTemplatedEmailCommand,
    SendEmailCommand,
    SendRawEmailCommand,
    SendTemplatedEmailCommand,
    SESClient
} from "@aws-sdk/client-ses";
import {EmailModel} from "../models/email.model";
import {SqsSendMessageError} from "../errors/sqs-send-message.error";
import {SesMessageSentConfirmationModel} from "../models/ses-message-sent-confirmation.model";
import {SesSendError} from "../errors/ses-send.error";
import {ClientOptionsInterface} from "../interfaces/client-options.interface";

@tag("SesClientInterface")
@moduleScoped(AwsModuleKeyname)
@injectable()
export class SesClient implements SesClientInterface {
    /**
     * The client to use to interact with AWS SES. It is a wrapper around the SESClient of @aws-sdk/client-ses.
     * @param logHandler The log handler used to output logs.
     * @param region The aws region for which the client will be used.
     */
    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.aws.region%") private readonly region: string,
    ) {
    }

    getClient(endpoint?: string): SESClient {
        return new SESClient({
            region: this.region,
            endpoint: endpoint ?? undefined,
        });
    }

    async sendTemplate(email: EmailModel, templateName: string, templateData: {[key in string]: string}, endpoint?: string, options?: Partial<ClientOptionsInterface>): Promise<SesMessageSentConfirmationModel> {
        try {
            const client = this.getClient(endpoint);

            const sendEmailCommand = new SendTemplatedEmailCommand({
                Source: email.from,
                Destination: {
                    ToAddresses: email.toAddresses,
                    CcAddresses: email.ccAddresses,
                    BccAddresses: email.bccAddresses,
                },
                Template: templateName,
                TemplateData: JSON.stringify(templateData),
            });

            const response = await client.send(sendEmailCommand, options);

            return {
                messageId: response.MessageId,
                metadata: response.$metadata,
            };
        } catch (error) {
            this.logHandler.error("SesClient: There was an error sending the email.", {
                extra: {
                    error,
                    email,
                    endpoint,
                }
            }, AwsModuleKeyname);

            throw new SesSendError(error, email);
        }
    }

    async send(email: EmailModel, endpoint?: string, options?: Partial<ClientOptionsInterface>): Promise<SesMessageSentConfirmationModel> {
        try {
            const client = this.getClient(endpoint);

            const sendEmailCommand = new SendEmailCommand({
                Message: {
                    Subject: {
                        Data: email.subject,
                        Charset: "UTF-8",
                    },
                    Body: {
                        Text: {
                            Data: email.body.text,
                            Charset: "UTF-8",
                        },
                        Html: {
                            Data: email.body.html,
                            Charset: "UTF-8",
                        },
                    },
                },
                Destination: {
                    ToAddresses: email.toAddresses,
                    CcAddresses: email.ccAddresses,
                    BccAddresses: email.bccAddresses,
                },
                Source: email.from,
            });

            const response = await client.send(sendEmailCommand, options);

            return {
                messageId: response.MessageId,
                metadata: response.$metadata,
            };
        } catch (error) {
            this.logHandler.error("SesClient: There was an error sending the email.", {
                extra: {
                    error,
                    email,
                    endpoint,
                }
            }, AwsModuleKeyname);

            throw new SesSendError(error, email);
        }
    }

}