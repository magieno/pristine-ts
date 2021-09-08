import {Event} from "../models/event";

/**
 * The Event Listener Interface defines the methods that an Event Listener must implement.
 */
export interface EventListenerInterface {
    /**
     * This method receives an event and returns whether or not the event listener supports that type of event.
     * This should always be called before calling handle.
     * @param event
     */
    supports<T>(event: Event<T>): boolean;

    /**
     * This method receives an event and handles it, but does not return a response.
     * @param event
     */
    handle<T>(event: Event<T>): Promise<void>;
}
