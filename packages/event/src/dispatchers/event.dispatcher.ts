import { injectable, injectAll, inject } from "tsyringe";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {Event} from "../models/event";
import {EventListenerInterface} from "../interfaces/event-listener.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";

/**
 * This class receives all the event listeners that were registered and calls them if they support the event.
 */
@injectable()
export class EventDispatcher {
    public constructor(@injectAll(ServiceDefinitionTagEnum.EventListener) private readonly eventListeners: EventListenerInterface[],
                       @inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface) {
    }

    /**
     * This method receives an event, loops through its event listeners and if they support the event,
     * will call their handle method.
     *
     * @param event
     */
    async dispatch(event: Event<any>): Promise<void> {
        const promises: Promise<void>[] = [];

        this.loghandler.debug("Dispatch the event", {
            event,
        });

        this.eventListeners.forEach( (eventListener: EventListenerInterface) => {
            if(eventListener.supports(event)) {
                promises.push(eventListener.handle(event))

                this.loghandler.debug("The EventListener supports the event", {
                    event,
                    eventListener,
                })
            }
            else {
                this.loghandler.debug("The EventListener doesn't support the event", {
                    event,
                    eventListener,
                })
            }
        });

        await Promise.allSettled(promises);
    }
}
