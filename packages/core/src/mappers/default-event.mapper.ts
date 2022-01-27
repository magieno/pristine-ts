import {EventMapperInterface} from "../interfaces/event-mapper.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CoreModuleKeyname} from "../core.module.keyname";
import {ExecutionContextInterface} from "../interfaces/execution-context.interface";
import {EventsExecutionOptionsInterface} from "../interfaces/events-execution-options.interface";
import {EventResponse} from "../models/event.response";

/**
 * We need a default mapper, else the container will complain when we do injectAll
 */

@moduleScoped(CoreModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class DefaultEventMapper implements EventMapperInterface<any, any>{
    map(event: object, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<any> {
        return {
            events: [],
            executionOrder: 'sequential',
        };
    }

    reverseMap(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>): void {
    }

    supportsMapping(event: object, executionContext: ExecutionContextInterface<any>): boolean {
        return false;
    }

    supportsReverseMapping(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>): boolean {
        return false;
    }

}
