import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {CoreModuleKeyname} from "../core.module.keyname";
import {EventHandlerInterface} from "../interfaces/event-handler.interface";
import {injectable} from "tsyringe";
import {Event} from "../models/event";
import {EventResponse} from "../models/event.response";

@tag(ServiceDefinitionTagEnum.EventHandler)
@moduleScoped(CoreModuleKeyname)
@injectable()
export class DefaultEventHandler implements EventHandlerInterface {
    handle<EventPayload, EventResponsePayload>(event: Event<EventPayload>, eventResponse: EventResponse<EventPayload, EventResponsePayload>): Promise<EventResponse<EventPayload, EventResponsePayload>> {
        return Promise.resolve(eventResponse);
    }

    supports<T>(event: Event<T>): boolean {
        return false;
    }

}
