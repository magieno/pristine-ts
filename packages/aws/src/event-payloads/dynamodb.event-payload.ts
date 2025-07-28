import {DynamodbModel} from "../models/dynamodb.model";

/**
 * The Pristine event payload type of a parsed DynamoDB event
 */
export class DynamodbEventPayload {
  eventId: string;
  eventVersion: string;
  eventSource: string;
  eventTime?: Date;
  awsRegion: string;
  eventName: string;
  eventSourceArn: string;
  dynamodb: DynamodbModel;
}
