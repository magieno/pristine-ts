import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {CoreModuleKeyname} from "../core.module.keyname";
import {EventHandlerInterface} from "../interfaces/event-handler.interface";
import {injectable} from "tsyringe";
import {Event} from "../models/event";
import {EventResponse} from "../models/event.response";

@tag(ServiceDefinitionTagEnum.EventHandler)
@moduleScoped(CoreModuleKeyname)
@injectable()
export class DefaultEventHandler implements EventHandlerInterface<any, any> {
  handle(event: Event<any>): Promise<EventResponse<any, any>> {
    return Promise.resolve(new EventResponse(event, {}));
  }

  supports<T>(event: Event<T>): boolean {
    return false;
  }

}
