import { injectable, injectAll, inject } from "tsyringe";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Event} from "../models/event";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {EventListenerInterface} from "../interfaces/event-listener.interface";
import {CoreModuleKeyname} from "../core.module.keyname";
import {EventResponse} from "../models/event.response";
import {EventDispatcherInterface} from "../interfaces/event-dispatcher.interface";

/**
 * This class receives all the event listeners that were registered and calls them if they support the event.
 */
@tag("EventDispatcherInterface")
@injectable()
export class EventDispatcher implements EventDispatcherInterface {

    /**
     * Dispatcher to dispatch the events to the event listeners that support them.
     * @param eventListeners All the event listeners that are tagged with ServiceDefinitionTagEnum.EventListener
     * @param logHandler
     */
    public constructor(@injectAll(ServiceDefinitionTagEnum.EventListener) private readonly eventListeners: EventListenerInterface[],
                       @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {

        this.eventListeners.sort( (a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    }

    /**
     * This method receives an event, loops through its event listeners and if they support the event,
     * will call their handle method.
     * Resolves once all the event listeners have settled, but does not return a response.
     *
     * @param event
     */
    async dispatch(event: Event<any>): Promise<EventResponse<any, any>> {
        this.logHandler.debug("Dispatch the event", {
            event,
            eventListeners: this.eventListeners,
            eventListenerNames: this.eventListeners.map(eventListener => eventListener.constructor.name),
        }, CoreModuleKeyname);

        const eventResponse = new EventResponse(event, undefined);

        for (const eventListener of this.eventListeners) {
            if(eventListener.supports(event)) {
                this.logHandler.debug("The EventListener supports the event", {
                    event,
                    eventListener,
                    eventListenerName: eventListener.constructor.name,
                }, CoreModuleKeyname)

                await eventListener.handle(event, eventResponse);
            }
            else {
                this.logHandler.debug("The EventListener doesn't support the event", {
                    event,
                    eventListener,
                    eventListenerName: eventListener.constructor.name,
                }, CoreModuleKeyname)
            }
        }

        return eventResponse;
    }
}
