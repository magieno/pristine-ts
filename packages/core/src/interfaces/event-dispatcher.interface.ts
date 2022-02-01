import {Event} from "../models/event";
import {EventResponse} from "../models/event.response";

export interface EventDispatcherInterface {
    dispatch(event: Event<any>): Promise<EventResponse<any, any>>;
}
