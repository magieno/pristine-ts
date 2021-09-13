import {Event, EventParserInterface} from "@pristine-ts/event";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {SqsEventPayload} from "../event-payloads/sqs.event-payload";
import {SqsAttributesModel} from "../models/sqs-attributes.model";
import {SqsEventType} from "../enums/sqs-event-type.enum";
import {EventBridgePayload} from "../event-payloads/event-bridge.payload";
import {EventBridgeEventTypeEnum} from "../enums/event-bridge-event-type.enum";

@tag(ServiceDefinitionTagEnum.EventParser)
@injectable()
export class EventBridgeEventParser implements EventParserInterface<EventBridgePayload>{

    parse(rawEvent: any): Event<EventBridgePayload>[] {
        const parsedEvents: Event<EventBridgePayload>[] = [];

        const event = new Event<EventBridgePayload>();

        if(rawEvent.source === "aws.events") {
            event.type = EventBridgeEventTypeEnum.ScheduledEvent
        }
        else {
            event.type = EventBridgeEventTypeEnum.Event
        }

        event.payload = new EventBridgePayload();
        event.payload.id = rawEvent.id;
        event.payload.source = rawEvent.source;
        event.payload.version = rawEvent.version;
        event.payload.detailType = rawEvent["detail-type"];
        event.payload.account = rawEvent.account;
        event.payload.time = rawEvent.time;
        event.payload.region = rawEvent.region;
        event.payload.resources = rawEvent.resources;
        event.payload.detail = rawEvent.detail;

        parsedEvents.push(event);

        return parsedEvents;
    }

    supports(event: any): boolean {
        return event.hasOwnProperty("source") &&
            event.hasOwnProperty("id") &&
            event.hasOwnProperty("version") &&
            event.hasOwnProperty("detail-type") &&
            event.hasOwnProperty("account") &&
            event.hasOwnProperty("time") &&
            event.hasOwnProperty("region") &&
            event.hasOwnProperty("resources") &&
            event.hasOwnProperty("detail");
    }
}
