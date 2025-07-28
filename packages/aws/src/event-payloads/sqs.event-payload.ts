import {SqsAttributesModel} from "../models/sqs-attributes.model";

/**
 * The Pristine event payload type of a parsed SQS event
 */
export class SqsEventPayload {
  eventSource: string;
  eventSourceArn?: string;
  awsRegion: string;
  md5OfBody?: string;
  messageAttributes?: any;
  messageId?: string;
  receiptHandle?: string;
  body?: string;
  attributes?: SqsAttributesModel;
}
