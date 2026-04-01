import {EventListenerInterface} from "../interfaces/event-listener.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {CoreModuleKeyname} from "../core.module.keyname";
import {injectable} from "tsyringe";
import {Event} from "../models/event";

@tag(ServiceDefinitionTagEnum.EventListener)
@moduleScoped(CoreModuleKeyname)
@injectable()
export class DefaultEventListener implements EventListenerInterface {
  execute<EventPayload>(event: Event<EventPayload>): Promise<void> {
    return Promise.resolve();
  }

  supports<T>(event: Event<T>): boolean {
    return false;
  }
}
