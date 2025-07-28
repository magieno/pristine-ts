import {SnsMessageAttributeModel} from "./sns-message-attribute.model";

/**
 * Model representing the object of the sns event.
 */
export class SnsModel {
  signatureVersion: string;
  eventTime: Date;
  signature: string;
  signingCertUrl: string;
  messageId: string;
  message: string;
  type: string;
  unsubscribeUrl: string;
  topicArn: string;
  subject: string;
  messageAttributes: SnsMessageAttributeModel[] = [];
}
