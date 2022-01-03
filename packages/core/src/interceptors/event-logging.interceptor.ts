import {EventInterceptorInterface} from "../interfaces/event-interceptor.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable, inject} from "tsyringe";
import {CoreModuleKeyname} from "../core.module.keyname";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {Event} from "../models/event";
import {ExecutionContextInterface} from "../interfaces/execution-context.interface";
import {EventResponse} from "../models/event.response";

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

    preMappingIntercept(event: object, executionContextInterface: ExecutionContextInterface<any>): Promise<object> {
        this.logHandler.debug("Event just before the EventMapping into an Event object.", {
            event,
            executionContextInterface
        }, CoreModuleKeyname)

        return Promise.resolve(event);
    }

    postMappingIntercept(event: Event<any>): Promise<Event<any>> {
        this.logHandler.debug("Event just after being mapped into an Event object.", {
            event,
        }, CoreModuleKeyname)

        return Promise.resolve(event);
    }

    preResponseMappingIntercept(eventResponse: EventResponse<any, any>): Promise<EventResponse<any, any>> {
        this.logHandler.debug("Event response just after being dispatched to the Event Listeners.")

        return Promise.resolve(eventResponse);
    }

    postResponseMappingIntercept(eventResponse: object): Promise<object> {
        this.logHandler.debug("Final event response that will be returned.")

        return Promise.resolve(eventResponse);
    }
}
