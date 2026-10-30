/**
 * Model representing the sending limits and the state of the SES account in a region.
 */
export class SesAccountModel {
  /**
   * False when SES paused sending for the whole account.
   */
  sendingEnabled: boolean = false;

  /**
   * False while the account is in the SES sandbox.
   */
  productionAccessEnabled: boolean = false;

  /**
   * `HEALTHY`, `PROBATION` or `SHUTDOWN`.
   */
  enforcementStatus?: string;

  /**
   * The maximum number of emails per second.
   */
  maxSendRate?: number;

  /**
   * The maximum number of emails per 24 hours.
   */
  max24HourSend?: number;

  /**
   * The number of emails sent in the last 24 hours.
   */
  sentLast24Hours?: number;
}
