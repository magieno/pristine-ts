import {SESv2Client} from "@aws-sdk/client-sesv2";
import {SesRawEmailModel} from "../models/ses-raw-email.model";
import {SesMessageSentConfirmationModel} from "../models/ses-message-sent-confirmation.model";
import {SesEmailIdentityModel} from "../models/ses-email-identity.model";
import {SesAccountModel} from "../models/ses-account.model";
import {ClientOptionsInterface} from "./client-options.interface";

/**
 * The SesV2Client Interface defines the methods that an SES v2 client must implement.
 * When injecting the SES v2 client the 'SesV2ClientInterface' tag should be used.
 */
export interface SesV2ClientInterface {
  /**
   * Returns the instantiated SESv2Client from the @aws-sdk/client-sesv2 library.
   * @param endpoint The endpoint for which the SES v2 client is created.
   */
  getClient(endpoint?: string): SESv2Client;

  /**
   * Sends a complete MIME message as is. Use it when the application renders the email itself
   * and needs its own headers (for example `List-Unsubscribe`).
   * @param email The raw email to send.
   * @param endpoint The endpoint to use.
   * @param options The options of the request.
   */
  sendRawEmail(email: SesRawEmailModel, endpoint?: string, options?: Partial<ClientOptionsInterface>): Promise<SesMessageSentConfirmationModel>;

  /**
   * Starts the verification of a domain or an email address. For a domain, Easy DKIM is used and
   * the returned model holds the DKIM tokens to publish in DNS.
   * @param identity The domain or the email address.
   * @param configurationSetName The configuration set used by default for emails sent from this identity.
   * @param endpoint The endpoint to use.
   */
  createEmailIdentity(identity: string, configurationSetName?: string, endpoint?: string): Promise<SesEmailIdentityModel>;

  /**
   * Returns the identity and its verification state, or null when SES does not know it.
   * @param identity The domain or the email address.
   * @param endpoint The endpoint to use.
   */
  getEmailIdentity(identity: string, endpoint?: string): Promise<SesEmailIdentityModel | null>;

  /**
   * Deletes the identity. Deleting an identity that does not exist succeeds.
   * @param identity The domain or the email address.
   * @param endpoint The endpoint to use.
   */
  deleteEmailIdentity(identity: string, endpoint?: string): Promise<void>;

  /**
   * Sets the custom MAIL FROM domain of an identity, so that SPF aligns with the sending domain.
   * @param identity The domain or the email address.
   * @param mailFromDomain The MAIL FROM domain, a subdomain of the identity (for example `bounce.example.com`).
   * @param useDefaultValueOnMxFailure True to fall back to the amazonses.com MAIL FROM when the MX record is missing; false to reject the email.
   * @param endpoint The endpoint to use.
   */
  putEmailIdentityMailFromAttributes(identity: string, mailFromDomain: string, useDefaultValueOnMxFailure?: boolean, endpoint?: string): Promise<void>;

  /**
   * Returns the sending limits and the state of the SES account.
   * @param endpoint The endpoint to use.
   */
  getAccount(endpoint?: string): Promise<SesAccountModel>;
}
