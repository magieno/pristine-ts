import {SqsAttributesModel} from "../models/sqs-attributes.model";

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
