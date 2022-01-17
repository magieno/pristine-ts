import {ApiGatewayEventsHandlingStrategyEnum} from "../enums/api-gateway-events-handling-strategy.enum";
import {RestApiEventPayload} from "../event-payloads/rest-api.event-payload";
import {Request} from "@pristine-ts/networking";
import {RestApiEventResponsePayload} from "../event-response-payloads/rest-api.event-response-payload";
import {EventMapperInterface, EventResponse, EventsExecutionOptionsInterface, ExecutionContextInterface} from "@pristine-ts/core";
import {injectable, inject} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {HttpRequestEventPayload} from "../event-payloads/http-request.event-payload";
import {HttpRequestEventResponsePayload} from "../event-response-payloads/http-request.event-response-payload";
import {AwsApiGatewayModuleKeyname} from "../aws-api-gateway.module.keyname";

@moduleScoped(AwsApiGatewayModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class HttpRequestApiEventMapper implements EventMapperInterface<HttpRequestEventPayload | Request, HttpRequestEventResponsePayload> {
    constructor(@inject("%" + AwsApiGatewayModuleKeyname + ".api_gateway.http_request_events.handling_strategy%") private readonly httpRequestsHandlingStrategy: ApiGatewayEventsHandlingStrategyEnum) {
    }

    supportsMapping(event: any, executionContext: ExecutionContextInterface<any>): boolean {
        throw new Error("Method not implemented.");
    }
    map(event: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<HttpRequestEventPayload | Request> {
        throw new Error("Method not implemented.");
    }
    supportsReverseMapping(eventResponse: EventResponse<HttpRequestEventPayload | Request, HttpRequestEventResponsePayload>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        throw new Error("Method not implemented.");
    }
    reverseMap(eventResponse: EventResponse<HttpRequestEventPayload | Request, HttpRequestEventResponsePayload>, response: any, executionContext: ExecutionContextInterface<any>) {
        throw new Error("Method not implemented.");
    }
}
