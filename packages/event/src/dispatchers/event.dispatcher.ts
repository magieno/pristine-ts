import { injectable, injectAll } from "tsyringe";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {Event} from "../models/event";
import {EventListenerInterface} from "../interfaces/event-listener.interface";

@injectable()
export class EventDispatcher {
    public constructor(@injectAll(ServiceDefinitionTagEnum.EventListener) private readonly eventListeners: EventListenerInterface[]) {
    }

    async dispatch(event: Event<any>): Promise<void> {
        const promises: Promise<void>[] = [];

        this.eventListeners.forEach( (eventListener: EventListenerInterface) => {
            if(eventListener.supports(event)) {
                promises.push(eventListener.handle(event))
            }
        });

        await Promise.all(promises);
    }
}