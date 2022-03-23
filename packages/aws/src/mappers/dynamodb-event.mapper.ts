import {Event, EventMapperInterface, EventResponse, ExecutionContextInterface, EventsExecutionOptionsInterface} from "@pristine-ts/core";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable, inject} from "tsyringe";
import {DynamodbEventType} from "../enums/dynamodb-event-type.enum";
import {DynamodbEventPayload} from "../event-payloads/dynamodb.event-payload";
import {DynamodbModel} from "../models/dynamodb.model";
import {DynamodbKeysModel} from "../models/dynamodb-keys.model";

@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class DynamodbEventMapper implements EventMapperInterface<DynamodbEventPayload, void>{

    /**
     * Finds the enum value corresponding to the event name.
     * @param eventName The event name of the DynamoDb event.
     * @private
     */
    private findEnum(eventName: string): DynamodbEventType{
        const keys = Object.keys(DynamodbEventType).filter(key => isNaN(Number(key)));
        for(const key of keys){
            if (DynamodbEventType[key] === eventName){
                return DynamodbEventType[key];
            }
        }
        return DynamodbEventType.UnknownDynamoDbEvent;
    }

    /**
     * Parses the keys from the DynamoDb event
     * @param object The keys to be parsed
     * @private
     */
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

    /**
     * Parses the DynamoDb event into a Pristine event.
     * @param rawEvent The raw DynamoDb event
     * @param executionContext The ExecutionContext from where the event is triggered.
     */
    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<DynamodbEventPayload> {
        const parsedEvents: Event<DynamodbEventPayload>[] = [];

        for(const record of rawEvent.Records) {
            const event = new Event<DynamodbEventPayload>(this.findEnum(record.eventName), new DynamodbEventPayload());
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

        return {
            executionOrder: 'parallel',
            events: parsedEvents,
        };
    }

    /**
     * Determines if the parser supports the event.
     * @param event The event to verify if the parser supports.
     * @param executionContext The ExecutionContext from where the event is triggered. It can easily be used to determine
     * where the current service is hosted.
     */
    supportsMapping(event: any, executionContext: ExecutionContextInterface<any>): boolean {
        return event.hasOwnProperty("Records") &&
            Array.isArray(event.Records) &&
            event.Records[0].hasOwnProperty("eventSource") &&
            event.Records[0].eventSource === "aws:dynamodb" &&
            event.Records[0].hasOwnProperty("dynamodb")
    }

    supportsReverseMapping(eventResponse: EventResponse<DynamodbEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        // todo: implement
        return false;
    }

    reverseMap(eventResponse: EventResponse<DynamodbEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): void {
        // todo: implement
    }
}
