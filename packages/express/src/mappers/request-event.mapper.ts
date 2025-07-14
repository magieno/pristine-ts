import {
    Event,
    EventMapperInterface, EventResponse,
    EventsExecutionOptionsInterface,
    ExecutionContextInterface,
    ExecutionContextKeynameEnum
} from "@pristine-ts/core";
import {moduleScoped, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {ExpressModuleKeyname} from "../express.module.keyname";
import {injectable} from "tsyringe";
import {RequestMapper} from "./request.mapper";
import {Request as ExpressRequest} from "express";
import {ResponseMapper} from "./response.mapper";

@moduleScoped(ExpressModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class RequestEventMapper implements EventMapperInterface<ExpressRequest, Response>{
    constructor(private readonly requestMapper: RequestMapper, private readonly responseMapper: ResponseMapper) {
    }

    supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
        // todo be more intelligent and add more conditions
        return executionContext.keyname === ExecutionContextKeynameEnum.Express;
    }

    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<any> {
        const request = this.requestMapper.map(rawEvent as ExpressRequest);
        return {
            executionOrder: "sequential",
            events: [
                new Event<any>("EXPRESS_REQUEST", request, request.id)
            ]
        }
    }

    reverseMap(eventResponse: EventResponse<ExpressRequest, Response>, response: any, executionContext: ExecutionContextInterface<any>): any {
        return this.responseMapper.reverseMap(response, executionContext.context.res)
    }

    supportsReverseMapping(eventResponse: EventResponse<any, any>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        return executionContext.keyname === ExecutionContextKeynameEnum.Express && response instanceof Response;
    }

}
