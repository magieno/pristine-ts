import {EventInterceptorInterface} from "../interfaces/event-interceptor.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable, inject} from "tsyringe";
import {CoreModuleKeyname} from "../core.module.keyname";
import {Event} from "@pristine-ts/event";
import {LogHandlerInterface} from "@pristine-ts/logging";

@injectable()
@moduleScoped(CoreModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventInterceptor)
export class EventLoggingInterceptor implements EventInterceptorInterface{
    constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    interceptEvent(event: Event<any>): Promise<Event<any>> {
        this.logHandler.info("New raw event received", event);
        return Promise.resolve(event);
    }

    interceptRawEvent(event: any): Promise<any> {
        this.logHandler.info("New event received", event);
        return Promise.resolve(event);
    }

}