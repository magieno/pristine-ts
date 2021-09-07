import {EventInterceptorInterface} from "../interfaces/event-interceptor.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable, inject} from "tsyringe";
import {CoreModuleKeyname} from "../core.module.keyname";
import {Event} from "@pristine-ts/event";
import {LogHandlerInterface} from "@pristine-ts/logging";

/**
 * This class is an interceptor to log the events. It is module scoped to Core module.
 * It is tagged as an EventInterceptor so it can be automatically injected with the all the other EventInterceptors.
 */
@injectable()
@moduleScoped(CoreModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventInterceptor)
export class EventLoggingInterceptor implements EventInterceptorInterface{
    constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    /**
     * This method intercepts an event and logs it.
     * @param event
     */
    interceptEvent(event: Event<any>): Promise<Event<any>> {
        this.logHandler.info("New event received", event);
        return Promise.resolve(event);
    }

    /**
     * This method intercepts a raw event and logs it.
     * @param event
     */
    interceptRawEvent(event: any): Promise<any> {
        this.logHandler.info("New raw event received", event);
        return Promise.resolve(event);
    }

}
