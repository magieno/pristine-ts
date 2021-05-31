import {Event, EventParserInterface} from "@pristine-ts/event";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable, inject} from "tsyringe";
import {DynamodbEventType} from "../enums/dynamodb-event-type.enum";
import {DynamodbEventPayload} from "../event-payloads/dynamodb.event-payload";
import {DynamodbModel} from "../models/dynamodb.model";
import {DynamodbKeysModel} from "../models/dynamodb-keys.model";
import {LogHandlerInterface} from "@pristine-ts/logging";

@tag(ServiceDefinitionTagEnum.EventParser)
@injectable()
export class DynamodbEventParser implements EventParserInterface<DynamodbEventPayload>{

    public constructor() {
    }

    private findEnum(eventName: string): DynamodbEventType{
        const keys = Object.keys(DynamodbEventType).filter(key => isNaN(Number(key)));
        for(const key of keys){
            if (DynamodbEventType[key] === eventName){
                return DynamodbEventType[key];
            }
        }
        return DynamodbEventType.UnknownDynamoDbEvent;
    }

    private parseKeys(object: any): DynamodbKeysModel[]{
        const parsedKeys: DynamodbKeysModel[] = []
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                const keyType = Object.keys(object[key])[0];
                parsedKeys.push({
                    keyName: key,
                    keyType,
                    keyValue: object[key][keyType],
                });
            }
        }
        return parsedKeys;
    }

    parse(rawEvent: any): Event<DynamodbEventPayload>[] {
        const parsedEvents: Event<DynamodbEventPayload>[] = [];
        for(const record of rawEvent.Records) {
            const event = new Event<DynamodbEventPayload>();
            event.type = this.findEnum(record.eventName);
            event.payload = new DynamodbEventPayload();

            event.payload.eventVersion = record.eventVersion;
            event.payload.eventSource = record.eventSource;
            if (record.dynamodb.ApproximateCreationDateTime) {
                event.payload.eventTime = new Date(record.dynamodb.ApproximateCreationDateTime);
            }
            event.payload.awsRegion = record.awsRegion;
            event.payload.eventName = record.eventName;
            event.payload.eventId = record.eventID;
            event.payload.eventSourceArn = record.eventSourceARN;
            event.payload.dynamodb = new DynamodbModel();
            event.payload.dynamodb.sequenceNumber = record.dynamodb.SequenceNumber;
            event.payload.dynamodb.sizeBytes = record.dynamodb.SizeBytes;
            event.payload.dynamodb.streamViewType = record.dynamodb.StreamViewType;
            event.payload.dynamodb.keys = record.dynamodb.Keys;
            event.payload.dynamodb.parsedKeys = this.parseKeys(record.dynamodb.Keys);
            if (record.dynamodb.NewImage) {
                event.payload.dynamodb.newImage = record.dynamodb.NewImage;
                event.payload.dynamodb.parsedNewImage = this.parseKeys(record.dynamodb.NewImage)
            }
            if (record.dynamodb.OldImage) {
                event.payload.dynamodb.oldImage = record.dynamodb.OldImage;
                event.payload.dynamodb.parsedOldImage = this.parseKeys(record.dynamodb.OldImage)
            }
            event.payload.dynamodb.tableName = record.eventSourceARN.split("/")[1];
            parsedEvents.push(event);
        }

        return parsedEvents;
    }

    supports(event: any): boolean {
        return event.hasOwnProperty("Records") &&
            Array.isArray(event.Records) &&
            event.Records[0].hasOwnProperty("eventSource") &&
            event.Records[0].eventSource === "aws:dynamodb" &&
            event.Records[0].hasOwnProperty("dynamodb")
    }

}
