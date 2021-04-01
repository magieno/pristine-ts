import {DynamodbModel} from "../models/dynamodb.model";

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
