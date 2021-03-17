import { injectable, injectAll } from "tsyringe";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {Event} from "../models/event";
import {EventListenerInterface} from "../interfaces/event-listener.interface";

/**
 * This class receives all the event listeners that were registered and calls them if they support the event.
 */
@injectable()
export class EventDispatcher {
    public constructor(@injectAll(ServiceDefinitionTagEnum.EventListener) private readonly eventListeners: EventListenerInterface[]) {
    }

    /**
     * This method receives an event, loops through its event listeners and if they support the event,
     * will call their handle method.
     *
     * @param event
     */
    async dispatch(event: Event<any>): Promise<void> {
        const promises: Promise<void>[] = [];

        this.eventListeners.forEach( (eventListener: EventListenerInterface) => {
            if(eventListener.supports(event)) {
                promises.push(eventListener.handle(event))
            }
        });

        await Promise.allSettled(promises);
    }
}
