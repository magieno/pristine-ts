import { injectable, injectAll, inject } from "tsyringe";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {Event} from "../models/event";
import {EventListenerInterface} from "../interfaces/event-listener.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {EventModuleKeyname} from "../event.module.keyname";

/**
 * This class receives all the event listeners that were registered and calls them if they support the event.
 */
@injectable()
export class EventDispatcher {
    /**
     * Dispatcher to dispatch the events to the event listeners that support them.
     * @param eventListeners All the event listeners that are tagged with ServiceDefinitionTagEnum.EventListener
     * @param logHandler
     */
    public constructor(@injectAll(ServiceDefinitionTagEnum.EventListener) private readonly eventListeners: EventListenerInterface[],
                       @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    /**
     * This method receives an event, loops through its event listeners and if they support the event,
     * will call their handle method.
     * Resolves once all the event listeners have settled, but does not return a response.
     *
     * @param event
     */
    async dispatch(event: Event<any>): Promise<void> {
        const promises: Promise<void>[] = [];

        this.logHandler.debug("Dispatch the event", {
            event,
            eventListeners: this.eventListeners,
            eventListenerNames: this.eventListeners.map(eventListener => eventListener.constructor.name),
        }, EventModuleKeyname);

        this.eventListeners.forEach( (eventListener: EventListenerInterface) => {
            if(eventListener.supports(event)) {
                this.logHandler.debug("The EventListener supports the event", {
                    event,
                    eventListener,
                    eventListenerName: eventListener.constructor.name,
                }, EventModuleKeyname)

                promises.push(eventListener.handle(event))
            }
            else {
                this.logHandler.debug("The EventListener doesn't support the event", {
                    event,
                    eventListener,
                    eventListenerName: eventListener.constructor.name,
                }, EventModuleKeyname)
            }
        });

        await Promise.allSettled(promises);
    }
}
