import {Event} from "@pristine-ts/event";

/**
 * The Event Interceptor Interface defines the methods that an Event Interceptor must implement. This
 * interceptor is called before the event is being dispatched to the event listeners.
 */
export interface EventInterceptorInterface {
    /**
     * This method receives a raw event object (before the an event is parsed into a know Pristine Event) and must return a transformed raw event object. If you don't want to
     * manipulate the raw event (when logging for example), juste resolve a promise with the raw event passed to this method.
     *
     * If you force to never resolve the promise, the execution will stall. Be careful.
     *
     * @param event
     */
    interceptRawEvent(event: any): Promise<any>;

    /**
     * This method receives an event object and must return a transformed event object. If you don't want to
     * manipulate the event object (when logging for example), juste resolve a promise with the event passed to this method.
     *
     * If you force to never resolve the promise, the execution will stall. Be careful.
     *
     * @param event
     */
    interceptEvent(event: Event<any>): Promise<Event<any>>;
}
