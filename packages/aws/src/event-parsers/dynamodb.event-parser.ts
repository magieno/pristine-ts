import {Event, EventParserInterface} from "@pristine-ts/event";
import {S3EventPayload} from "../event-payloads/s3.event-payload";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import { injectable } from "tsyringe";
import {S3EventType} from "../enums/s3-event-type.enum";
import {IdentityModel} from "../models/identity.model";
import {RequestParametersModel} from "../models/request-parameters.model";
import {ResponseElementsModel} from "../models/response-elements.model";
import {S3Model} from "../models/s3.model";
import {S3BucketModel} from "../models/s3-bucket.model";
import {S3ObjectModel} from "../models/s3-object.model";
import {DynamodbEventType} from "../enums/dynamodb-event-type.enum";
import {DynamodbEventPayload} from "../event-payloads/dynamodb.event-payload";
import {DynamodbModel} from "../models/dynamodb.model";
import {DynamodbKeysModel} from "../models/dynamodb-keys.model";

@tag(ServiceDefinitionTagEnum.EventParser)
@injectable()
export class DynamodbEventParser implements EventParserInterface<DynamodbEventPayload>{

    private findEnum(eventName: string): DynamodbEventType{
        const keys = Object.keys(DynamodbEventType).filter(key => isNaN(Number(key)));
        for(const key of keys){
            if (DynamodbEventType[key] === eventName){
                return S3EventType[key];
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

    parse(rawEvent: any): Event<DynamodbEventPayload> {
        const event = new Event<DynamodbEventPayload>();
        event.type = this.findEnum(rawEvent.eventName);
        event.payload =  new DynamodbEventPayload();

        event.payload.eventVersion = rawEvent.eventVersion;
        event.payload.eventSource = rawEvent.eventSource;
        if(rawEvent.dynamodb.ApproximateCreationDateTime) {
            event.payload.eventTime = new Date(rawEvent.dynamodb.ApproximateCreationDateTime);
        }
        event.payload.awsRegion = rawEvent.awsRegion;
        event.payload.eventName = rawEvent.eventName;
        event.payload.eventId = rawEvent.eventID;
        event.payload.eventSourceArn = rawEvent.eventSourceARN;
        event.payload.dynamodb = new DynamodbModel();
        event.payload.dynamodb.sequenceNumber = rawEvent.dynamodb.SequenceNumber;
        event.payload.dynamodb.sizeBytes = rawEvent.dynamodb.SizeBytes;
        event.payload.dynamodb.streamViewType = rawEvent.dynamodb.StreamViewType;
        event.payload.dynamodb.keys = rawEvent.dynamodb.Keys;
        event.payload.dynamodb.parsedKeys = this.parseKeys(rawEvent.dynamodb.Keys);
        if(rawEvent.dynamodb.NewImage){
            event.payload.dynamodb.newImage = rawEvent.dynamodb.NewImage;
            event.payload.dynamodb.parsedNewImage = this.parseKeys(rawEvent.dynamodb.NewImage)
        }
        if(rawEvent.dynamodb.OldImage){
            event.payload.dynamodb.newImage = rawEvent.dynamodb.OldImage;
            event.payload.dynamodb.parsedNewImage = this.parseKeys(rawEvent.dynamodb.OldImage)
        }
        event.payload.dynamodb.tableName = rawEvent.eventSourceARN.split("/")[1];

        return event;
    }

    supports(event: any): boolean {
        return event.hasOwnProperty("eventSource") &&
            event.eventSource === "aws:dynamodb" &&
            event.hasOwnProperty("dynamodb")
    }

}
