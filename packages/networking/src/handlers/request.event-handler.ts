import {Event, EventHandlerInterface, EventResponse} from "@pristine-ts/core";
import {injectable} from "tsyringe";
import {Response} from "../models/response";
import {Request} from "../models/request";

@injectable()
export class RequestEventHandler implements EventHandlerInterface<Request, Response> {
    priority: number = Number.MAX_SAFE_INTEGER;

    // handle(event: Event<Request>): Promise<EventResponse<Request, Response>> {
    //     // Load the router and start executing the request.
    //
    //     return Promise.resolve(new EventResponse<Request, Response>(event, new Response()));
    // }

    supports<T>(event: Event<T>): boolean {
        return event.payload instanceof Request;
    }

    handle(event: Event<Request>): Promise<EventResponse<Request, Response>> {
        return Promise.resolve(new EventResponse<Request, Response>(event, new Response()));
    }

}
