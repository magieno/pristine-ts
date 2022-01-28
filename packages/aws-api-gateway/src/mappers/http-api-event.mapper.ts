import {ApiGatewayEventsHandlingStrategyEnum} from "../enums/api-gateway-events-handling-strategy.enum";
import {
    Event,
    EventMapperInterface,
    EventResponse,
    EventsExecutionOptionsInterface,
    ExecutionContextInterface
} from "@pristine-ts/core";
import {inject, injectable} from "tsyringe";
import {moduleScoped, Request, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {HttpApiEventPayload} from "../event-payloads/http-api.event-payload";
import {HttpApiEventResponsePayload} from "../event-response-payloads/http-api.event-response-payload";
import {AwsApiGatewayModuleKeyname} from "../aws-api-gateway.module.keyname";
import {ApiGatewayEventTypeEnum} from "../enums/api-gateway-event-type.enum";
import {BaseApiEventMapper} from "./base-api-event.mapper";
import {LogHandlerInterface} from "@pristine-ts/logging";

@moduleScoped(AwsApiGatewayModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class HttpApiEventMapper extends BaseApiEventMapper implements EventMapperInterface<HttpApiEventPayload | Request, HttpApiEventResponsePayload | Response> {
    constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
                @inject("%" + AwsApiGatewayModuleKeyname + ".http_api_events.handling_strategy%") private readonly httpRequestsHandlingStrategy: ApiGatewayEventsHandlingStrategyEnum) {
        super();
    }

    supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
        return rawEvent.hasOwnProperty("version") &&
            rawEvent.version === "2.0" &&
            rawEvent.hasOwnProperty("headers") &&
            rawEvent.hasOwnProperty("requestContext");
    }

    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<HttpApiEventPayload | Request> {
        switch(this.httpRequestsHandlingStrategy) {
            case ApiGatewayEventsHandlingStrategyEnum.Request:
                const request = new Request(
                    this.mapHttpMethod(rawEvent.requestContext.http.method),
                    rawEvent.requestContext.http.path + (rawEvent.rawQueryString ? "?" + rawEvent.rawQueryString : "")
                );
                request.headers = rawEvent.headers;
                request.body = rawEvent.body;
                request.rawBody = rawEvent.body;

                return {
                    executionOrder: "sequential",
                    events: [new Event<Request>(ApiGatewayEventTypeEnum.HttpApiEvent, request)],
                };

                case ApiGatewayEventsHandlingStrategyEnum.Event:
                const httpRequestEventPayload = new HttpApiEventPayload(rawEvent.version, rawEvent.routeKey, rawEvent.rawPath)
                httpRequestEventPayload.rawQueryString = rawEvent.rawQueryString;
                httpRequestEventPayload.cookies = rawEvent.cookies;
                httpRequestEventPayload.headers = rawEvent.headers;
                httpRequestEventPayload.queryStringParameters = rawEvent.queryStringParameters;
                httpRequestEventPayload.isBase64Encoded = rawEvent.isBase64Encoded;
                httpRequestEventPayload.body = rawEvent.body;
                httpRequestEventPayload.pathParameters = rawEvent.pathParameters;
                httpRequestEventPayload.stageVariables = rawEvent.stageVariables;

                if (rawEvent.hasOwnProperty("requestContext")) {
                    httpRequestEventPayload.requestContext =  {
                        accountId: rawEvent.requestContext.accountId,
                        apiId: rawEvent.requestContext.apiId,
                        domainName: rawEvent.requestContext.domainName,
                        domainPrefix: rawEvent.requestContext.domainPrefix,
                        http: {
                            method: rawEvent.requestContext.http.method,
                            path: rawEvent.requestContext.http.path,
                            protocol: rawEvent.requestContext.http.protocol,
                            sourceIp: rawEvent.requestContext.http.sourceIp,
                            userAgent: rawEvent.requestContext.http.userAgent,
                        },
                        requestId: rawEvent.requestContext.requestId,
                        routeKey: rawEvent.requestContext.routeKey,
                        stage: rawEvent.requestContext.stage,
                        time: rawEvent.requestContext.time,
                        timeEpoch: rawEvent.requestContext.timeEpoch,
                        authentication: rawEvent.requestContext.authentication,
                        authorizer: rawEvent.requestContext.authorizer,
                    }
                }

                return {
                    executionOrder: "sequential",
                    events: [new Event<HttpApiEventPayload>(ApiGatewayEventTypeEnum.HttpApiEvent, httpRequestEventPayload)],
                };
        }
    }

    supportsReverseMapping(eventResponse: EventResponse<HttpApiEventPayload | Request, HttpApiEventResponsePayload | Response>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        return eventResponse.event.type === ApiGatewayEventTypeEnum.HttpApiEvent;
    }

    reverseMap(eventResponse: EventResponse<HttpApiEventPayload | Request, HttpApiEventResponsePayload | Response>, response: any, executionContext: ExecutionContextInterface<any>): any {
        if(eventResponse.response instanceof HttpApiEventResponsePayload) {
            return eventResponse.response;
        } else if(eventResponse.response instanceof Response) {
            let body = eventResponse.response.body;

            if(typeof body === "object") {
                try {
                    body = JSON.stringify(body);
                }
                catch (e) {
                    this.logHandler.error("Could not convert the response body into a string by stringifying it as a JSON", {

                    }, AwsApiGatewayModuleKeyname)
                }
            }

            const httpRequestEventResponsePayload = new HttpApiEventResponsePayload(eventResponse.response.status, body);

            if(eventResponse.response.headers) {
                httpRequestEventResponsePayload.headers = eventResponse.response.headers;
            }
            httpRequestEventResponsePayload.isBase64Encoded = false;

            return httpRequestEventResponsePayload;
        } else {
            return new HttpApiEventResponsePayload(200, eventResponse.response);
        }
    }
}
