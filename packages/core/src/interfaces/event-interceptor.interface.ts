import {Event} from "@pristine-ts/event";

export interface EventInterceptorInterface {
    interceptRawEvent(event: any): Promise<any>;

    interceptEvent(event: Event<any>): Promise<Event<any>>;
}