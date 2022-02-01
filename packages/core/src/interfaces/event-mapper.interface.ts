import {ExecutionContextInterface} from "./execution-context.interface";
import {EventResponse} from "../models/event.response";
import {Event} from "../models/event";
import {EventsExecutionOptionsInterface} from "./events-execution-options.interface";

export interface EventMapperInterface<EventPayload, EventResponsePayload> {
    supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean;

    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<EventPayload>;

    supportsReverseMapping(eventResponse: EventResponse<EventPayload, EventResponsePayload>, response: any, executionContext: ExecutionContextInterface<any>): boolean;

    reverseMap(eventResponse: EventResponse<EventPayload, EventResponsePayload>, response: any, executionContext: ExecutionContextInterface<any>): any;
}
