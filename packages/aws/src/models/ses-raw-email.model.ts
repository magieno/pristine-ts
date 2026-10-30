/**
 * Model representing a complete MIME message that SES v2 sends as is.
 */
export class SesRawEmailModel {
  /**
   * The complete MIME message: headers, a blank line, then the body. SES only adds its own
   * DKIM signature and Message-ID.
   */
  rawMessage: string | Uint8Array;

  /**
   * The envelope sender. When absent, SES uses the `From` header of the raw message.
   */
  from?: string;

  /**
   * The envelope recipients. When absent, SES uses the `To`, `Cc` and `Bcc` headers of the raw message.
   */
  destinations?: string[];

  /**
   * The SES configuration set that receives the events (delivery, bounce, complaint) of this email.
   */
  configurationSetName?: string;

  /**
   * Message tags, sent back with every event of this email. Names and values accept only
   * ASCII letters, digits, `_` and `-`.
   */
  tags?: { [key in string]: string };
}
