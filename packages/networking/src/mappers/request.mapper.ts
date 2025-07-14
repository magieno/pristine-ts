import {moduleScoped, Request, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {
    Event,
    EventMapperInterface,
    EventResponse,
    EventsExecutionOptionsInterface,
    ExecutionContextInterface
} from "@pristine-ts/core";

@moduleScoped(NetworkingModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class RequestMapper implements EventMapperInterface<Request, Response>{
    supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
        return rawEvent instanceof Request;
    }

    map(request: Request, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<Request> {
        return {
            executionOrder: "sequential",
            events: [new Event<Request>("Request", request, request.id)],
        };
    }

    supportsReverseMapping(eventResponse: EventResponse<Request, Response>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        return eventResponse.response instanceof Response;
    }

    reverseMap(eventResponse: EventResponse<Request, Response>, response: any, executionContext: ExecutionContextInterface<any>): any {
        return eventResponse.response;
    }

}