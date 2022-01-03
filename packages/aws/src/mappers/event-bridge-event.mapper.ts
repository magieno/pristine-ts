import {Event, EventMapperInterface, EventResponse, ExecutionContextInterface} from "@pristine-ts/core";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {EventBridgePayload} from "../event-payloads/event-bridge.payload";
import {EventBridgeEventTypeEnum} from "../enums/event-bridge-event-type.enum";
import {EventsExecutionOptionsInterface} from "@pristine-ts/core/dist/types/interfaces/events-execution-options.interface";

@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class EventBridgeEventMapper implements EventMapperInterface<EventBridgePayload, void>{

    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<EventBridgePayload> {
        const parsedEvents: Event<EventBridgePayload>[] = [];

        let eventType: EventBridgeEventTypeEnum;

        if(rawEvent.source === "aws.events") {
            eventType = EventBridgeEventTypeEnum.ScheduledEvent
        }
        else {
            eventType = EventBridgeEventTypeEnum.Event
        }

        const event = new Event<EventBridgePayload>(eventType, new EventBridgePayload());

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

        return {
            executionOrder: 'parallel',
            events: parsedEvents,
        };
    }

    supportsMapping(event: any, executionContext: ExecutionContextInterface<any>): boolean {
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

    supportsReverseMapping(eventResponse: EventResponse<EventBridgePayload, void>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        // todo: implement
        return false;
    }

    reverseMap(eventResponse: EventResponse<EventBridgePayload, void>, response: any, executionContext: ExecutionContextInterface<any>): void {
        // todo: implement
    }
}
