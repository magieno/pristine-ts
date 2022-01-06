import {Event} from "../models/event";
import {EventResponse} from "../models/event.response";

/**
 * The Event Listener Interface defines the methods that an Event Listener must implement.
 */
export interface EventHandlerInterface {

    /**
     * This property represents the priority (highest number has the highest priority). Use this to specify
     * which listener will be called the first one.
     */
    priority?: number;

    /**
     * This method receives an event and returns whether or not the event listener supports that type of event.
     * This should always be called before calling handle.
     * @param event
     */
    supports<T>(event: Event<T>): boolean;

    /**
     * This method receives an event and handles it and returns an EventResponse.
     * @param event
     * @param eventResponse The event response that was handled by a previous Handler.
     */
    handle<EventPayload, EventResponsePayload>(event: Event<EventPayload>, eventResponse: EventResponse<EventPayload, EventResponsePayload>): Promise<EventResponse<EventPayload, EventResponsePayload>>;
}
