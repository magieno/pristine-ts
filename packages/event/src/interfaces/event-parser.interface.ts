import {Event} from "../models/event";

/**
 * The Event Parser Interface defines the methods that an Event Parser must implement.
 */
export interface EventParserInterface<T> {
    /**
     * This method receives an event and returns return or not the event parser supports that type of event.
     * This should always be called before calling parse.
     * @param event
     */
    supports(event: any): boolean;

    /**
     * This method receives a raw event, and returns an array of parsed event of type Event.
     * @param event
     */
    parse(event: any): Event<T>[];
}
