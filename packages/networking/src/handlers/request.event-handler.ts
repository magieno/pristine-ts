import {Event, EventHandlerInterface, EventResponse} from "@pristine-ts/core";
import {injectable} from "tsyringe";
import {Response} from "../models/response";
import {Request} from "../models/request";

@injectable()
export class RequestEventHandler implements EventHandlerInterface {
    priority: number = Number.MAX_SAFE_INTEGER;

    handle<EventPayload, EventResponsePayload>(event: Event<Request>, eventResponse: EventResponse<Request, Response>): Promise<EventResponse<EventPayload, EventResponsePayload>> {
        return Promise.resolve(undefined);
    }

    supports<T>(event: Event<T>): boolean {
        if(event.)
        return false;
    }

}
