import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {
    Event,
    EventMapperInterface,
    EventResponse,
    EventsExecutionOptionsInterface,
    ExecutionContextInterface
} from "@pristine-ts/core";
import {Request} from "../models/request";
import {Response} from "../models/response";

@moduleScoped(NetworkingModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class RequestMapper implements EventMapperInterface<Request, Response>{
    supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
        return rawEvent instanceof Request || (
            rawEvent.hasOwnProperty("httpMethod") && rawEvent.hasOwnProperty("url"));
    }

    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<Request> {
        if(rawEvent instanceof Request) {
            return {
                executionOrder: "sequential",
                events: [new Event<Request>("Request", rawEvent)],
            };
        }

        return {
            executionOrder: "sequential",
            events: [new Event<Request>("Request", new Request({
                url: rawEvent.url,
                httpMethod: rawEvent.httpMethod,
                body: rawEvent.body,
                rawBody: rawEvent.body,
                headers: rawEvent.headers,
            }))],
        };
    }

    supportsReverseMapping(eventResponse: EventResponse<Request, Response>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        return eventResponse.response instanceof Response;
    }

    reverseMap(eventResponse: EventResponse<Request, Response>, response: any, executionContext: ExecutionContextInterface<any>): any {
        return eventResponse.response;
    }

}