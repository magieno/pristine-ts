import { injectable, injectAll, inject } from "tsyringe";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Event} from "../models/event";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {EventHandlerInterface} from "../interfaces/event-handler.interface";
import {CoreModuleKeyname} from "../core.module.keyname";
import {EventResponse} from "../models/event.response";
import {EventDispatcherInterface} from "../interfaces/event-dispatcher.interface";
import {EventListenerInterface} from "../interfaces/event-listener.interface";
import {EventDispatchingError} from "../errors/event-dispatching.error";
import {EventDispatcherNoEventHandlersError} from "../errors/event-dispatcher-no-event-handlers.error";

/**
 * This class receives all the event handlers and listeners that were registered and calls them if they support the event.
 */
@tag("EventDispatcherInterface")
@injectable()
export class EventDispatcher implements EventDispatcherInterface {

    /**
     * Dispatcher to dispatch the events to the event handlers that support them.
     * @param eventHandlers All the event handlers that are tagged with ServiceDefinitionTagEnum.EventHandler
     * @param eventListeners
     * @param logHandler
     */
    public constructor(@injectAll(ServiceDefinitionTagEnum.EventHandler) private readonly eventHandlers: EventHandlerInterface<any, any>[],
                       @injectAll(ServiceDefinitionTagEnum.EventListener) private readonly eventListeners: EventListenerInterface[],
                       @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {

        this.eventHandlers.sort( (a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    }

    /**
     * This method receives an event, loops through its event handlers and listeners and if they support the event,
     * will call their handle method.
     * Resolves once all the event handlers and listeners have settled, but does not return a response.
     *
     * @param event
     */
    async dispatch(event: Event<any>): Promise<EventResponse<any, any>> {
        this.logHandler.debug("Dispatch the event", {
            event,
            eventHandlers: this.eventHandlers,
            eventHandlerNames: this.eventHandlers.map(eventHandler => eventHandler.constructor.name),
        }, CoreModuleKeyname);

        // Notify the EventListeners that an event exists. The difference between a Handler and a Listener, is that a handler is
        // expected to return an EventResponse, while a listener doesn't return anything. An EventListener simply does passive listening.

        let eventListenerPromises: Promise<void>[] = [];

        this.eventListeners.forEach(eventListener => {
            if(eventListener.supports(event)) {
                eventListenerPromises.push(eventListener.execute(event));
            }
        });

        const supportingEventHandlers: EventHandlerInterface<any, any>[] = [];

        for (const eventHandler of this.eventHandlers) {
            if(eventHandler.supports(event)) {
                this.logHandler.debug("The EventHandler supports the event", {
                    event,
                    eventHandler: eventHandler,
                    eventHandlerName: eventHandler.constructor.name,
                }, CoreModuleKeyname)

                supportingEventHandlers.push(eventHandler);
                break;
            }
            else {
                this.logHandler.debug("The EventHandler doesn't support the event", {
                    event,
                    eventHandler: eventHandler,
                    eventHandlerName: eventHandler.constructor.name,
                }, CoreModuleKeyname)
            }
        }

        if(supportingEventHandlers.length === 0) {
            throw new EventDispatcherNoEventHandlersError("There are no EventHandlers that support this event.", event);
        } else if (supportingEventHandlers.length > 1) {
            this.logHandler.warning("There are more than one EventHandler that support this event.")
        }

        // We only support executing the handler with the highest priority.
        const eventResponse = await supportingEventHandlers[0].handle(event);

        await Promise.allSettled(eventListenerPromises);

        return eventResponse;
    }
}
