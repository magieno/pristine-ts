import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {CoreModuleKeyname} from "../core.module.keyname";
import {EventHandlerInterface} from "../interfaces/event-handler.interface";
import {inject, injectable} from "tsyringe";
import {Event} from "../models/event";
import {EventResponse} from "../models/event.response";
import {LogHandlerInterface} from "@pristine-ts/logging";

@tag(ServiceDefinitionTagEnum.EventHandler)
@moduleScoped(CoreModuleKeyname)
@injectable()
export class DefaultEventHandler implements EventHandlerInterface<any, any> {
    constructor(private readonly logHandler: LogHandlerInterface) {
    }
    handle(event: Event<any>): Promise<EventResponse<any, any>> {
        this.logHandler.warning("No event handler was found for the event.", {
            event,
        })
        return Promise.resolve(new EventResponse(event, {}));
    }

    supports<T>(event: Event<T>): boolean {
        return false;
    }

}
