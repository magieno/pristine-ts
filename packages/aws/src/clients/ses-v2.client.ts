import {AwsModuleKeyname} from "../aws.module.keyname";
import {AwsConfigurationKeys} from "../aws.configuration-keys";
import {injectConfig, moduleScoped, tag, traced} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {
  CreateEmailIdentityCommand,
  DeleteEmailIdentityCommand,
  GetAccountCommand,
  GetEmailIdentityCommand,
  GetEmailIdentityCommandOutput,
  PutEmailIdentityMailFromAttributesCommand,
  SendEmailCommand,
  SESv2Client,
} from "@aws-sdk/client-sesv2";
import {SesV2ClientInterface} from "../interfaces/ses-v2-client.interface";
import {SesRawEmailModel} from "../models/ses-raw-email.model";
import {SesMessageSentConfirmationModel} from "../models/ses-message-sent-confirmation.model";
import {SesEmailIdentityModel} from "../models/ses-email-identity.model";
import {SesAccountModel} from "../models/ses-account.model";
import {SesV2RequestError} from "../errors/ses-v2-request.error";
import {ClientOptionsInterface} from "../interfaces/client-options.interface";

@tag("SesV2ClientInterface")
@moduleScoped(AwsModuleKeyname)
@injectable()
export class SesV2Client implements SesV2ClientInterface {
  /**
   * The client to use to interact with AWS SES v2. It is a wrapper around the SESv2Client of @aws-sdk/client-sesv2.
   * @param logHandler The log handler used to output logs.
   * @param region The aws region for which the client will be used.
   */
  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @injectConfig(AwsConfigurationKeys.Region) private readonly region: string,
  ) {
  }

  getClient(endpoint?: string): SESv2Client {
    return new SESv2Client({
      region: this.region,
      endpoint: endpoint ?? undefined,
    });
  }

  @traced()
  async sendRawEmail(email: SesRawEmailModel, endpoint?: string, options?: Partial<ClientOptionsInterface>): Promise<SesMessageSentConfirmationModel> {
    const data = typeof email.rawMessage === "string" ? new TextEncoder().encode(email.rawMessage) : email.rawMessage;

    const command = new SendEmailCommand({
      FromEmailAddress: email.from,
      Destination: email.destinations ? {ToAddresses: email.destinations} : undefined,
      Content: {
        Raw: {
          Data: data,
        },
      },
      ConfigurationSetName: email.configurationSetName,
      EmailTags: email.tags ? Object.keys(email.tags).map(name => ({Name: name, Value: email.tags![name]})) : undefined,
    });

    try {
      const response = await this.getClient(endpoint).send(command, options);

      return {
        messageId: response.MessageId,
        metadata: response.$metadata,
      };
    } catch (error) {
      // The raw message is not logged: it can hold one-time codes and personal data.
      throw this.toError("SendEmail", error, {from: email.from, destinations: email.destinations, endpoint});
    }
  }

  @traced()
  async createEmailIdentity(identity: string, configurationSetName?: string, endpoint?: string): Promise<SesEmailIdentityModel> {
    try {
      const response = await this.getClient(endpoint).send(new CreateEmailIdentityCommand({
        EmailIdentity: identity,
        ConfigurationSetName: configurationSetName,
      }));

      const model = new SesEmailIdentityModel();
      model.identity = identity;
      model.identityType = response.IdentityType;
      model.verifiedForSendingStatus = response.VerifiedForSendingStatus ?? false;
      model.dkimStatus = response.DkimAttributes?.Status;
      model.dkimTokens = response.DkimAttributes?.Tokens ?? [];
      return model;
    } catch (error) {
      throw this.toError("CreateEmailIdentity", error, {identity, endpoint});
    }
  }

  @traced()
  async getEmailIdentity(identity: string, endpoint?: string): Promise<SesEmailIdentityModel | null> {
    let response: GetEmailIdentityCommandOutput;

    try {
      response = await this.getClient(endpoint).send(new GetEmailIdentityCommand({
        EmailIdentity: identity,
      }));
    } catch (error) {
      if ((error as any)?.name === "NotFoundException") {
        return null;
      }

      throw this.toError("GetEmailIdentity", error, {identity, endpoint});
    }

    const model = new SesEmailIdentityModel();
    model.identity = identity;
    model.identityType = response.IdentityType;
    model.verifiedForSendingStatus = response.VerifiedForSendingStatus ?? false;
    model.verificationStatus = response.VerificationStatus;
    model.dkimStatus = response.DkimAttributes?.Status;
    model.dkimTokens = response.DkimAttributes?.Tokens ?? [];
    model.mailFromDomain = response.MailFromAttributes?.MailFromDomain;
    model.mailFromDomainStatus = response.MailFromAttributes?.MailFromDomainStatus;
    return model;
  }

  @traced()
  async deleteEmailIdentity(identity: string, endpoint?: string): Promise<void> {
    try {
      await this.getClient(endpoint).send(new DeleteEmailIdentityCommand({
        EmailIdentity: identity,
      }));
    } catch (error) {
      if ((error as any)?.name === "NotFoundException") {
        return;
      }

      throw this.toError("DeleteEmailIdentity", error, {identity, endpoint});
    }
  }

  @traced()
  async putEmailIdentityMailFromAttributes(identity: string, mailFromDomain: string, useDefaultValueOnMxFailure: boolean = true, endpoint?: string): Promise<void> {
    try {
      await this.getClient(endpoint).send(new PutEmailIdentityMailFromAttributesCommand({
        EmailIdentity: identity,
        MailFromDomain: mailFromDomain,
        BehaviorOnMxFailure: useDefaultValueOnMxFailure ? "USE_DEFAULT_VALUE" : "REJECT_MESSAGE",
      }));
    } catch (error) {
      throw this.toError("PutEmailIdentityMailFromAttributes", error, {identity, mailFromDomain, endpoint});
    }
  }

  @traced()
  async getAccount(endpoint?: string): Promise<SesAccountModel> {
    try {
      const response = await this.getClient(endpoint).send(new GetAccountCommand({}));

      const model = new SesAccountModel();
      model.sendingEnabled = response.SendingEnabled ?? false;
      model.productionAccessEnabled = response.ProductionAccessEnabled ?? false;
      model.enforcementStatus = response.EnforcementStatus;
      model.maxSendRate = response.SendQuota?.MaxSendRate;
      model.max24HourSend = response.SendQuota?.Max24HourSend;
      model.sentLast24Hours = response.SendQuota?.SentLast24Hours;
      return model;
    } catch (error) {
      throw this.toError("GetAccount", error, {endpoint});
    }
  }

  private toError(operation: string, error: any, extra: { [key in string]: any }): SesV2RequestError {
    this.logHandler.error(`SesV2Client: The SES v2 operation '${operation}' failed.`, {
      extra: {
        error,
        ...extra,
      }
    });

    return new SesV2RequestError(operation, error, extra);
  }
}
