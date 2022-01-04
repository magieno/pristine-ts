import {ExecutionContextInterface} from "./execution-context.interface";
import {EventResponse} from "../models/event.response";
import {Event} from "../models/event";
import {EventsExecutionOptionsInterface} from "./events-execution-options.interface";

export interface EventMapperInterface<T, R> {
    supportsMapping(event: object, executionContext: ExecutionContextInterface<any>): boolean;

    map(event: object, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<T>;

    supportsReverseMapping(eventResponse: EventResponse<T, R>, response: any, executionContext: ExecutionContextInterface<any>): boolean;

    reverseMap(eventResponse: EventResponse<T, R>, response: any, executionContext: ExecutionContextInterface<any>): any;
}
