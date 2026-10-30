/**
 * Model representing an SES v2 email identity (a domain or an email address) and its verification state.
 */
export class SesEmailIdentityModel {
  /**
   * The domain or the email address.
   */
  identity: string;

  /**
   * `DOMAIN`, `EMAIL_ADDRESS` or `MANAGED_DOMAIN`.
   */
  identityType?: string;

  /**
   * True when SES accepts mail sent from this identity.
   */
  verifiedForSendingStatus: boolean = false;

  /**
   * `PENDING`, `SUCCESS`, `FAILED`, `TEMPORARY_FAILURE` or `NOT_STARTED`.
   */
  verificationStatus?: string;

  /**
   * The Easy DKIM status: `PENDING`, `SUCCESS`, `FAILED`, `TEMPORARY_FAILURE` or `NOT_STARTED`.
   */
  dkimStatus?: string;

  /**
   * The Easy DKIM tokens. Each token `t` must be published as the CNAME
   * `t._domainkey.<domain>` pointing to `t.dkim.amazonses.com`.
   */
  dkimTokens: string[] = [];

  /**
   * The custom MAIL FROM domain, when one is configured.
   */
  mailFromDomain?: string;

  /**
   * `PENDING`, `SUCCESS`, `FAILED` or `TEMPORARY_FAILURE`.
   */
  mailFromDomainStatus?: string;
}
