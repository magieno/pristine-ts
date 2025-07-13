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

/**
 * The Http api event mapper maps a raw event to EventsExecutionOptionsInterface with either an HttpApiEventPayload or a Request
 * depending on the handling strategy defined in the environment configs.
 * It is tagged as an ServiceDefinitionTagEnum.EventMapper so that it can be injected with all the other event mappers.
 * It is module scoped so that it gets injected only if the AWS-Api-Gateway module is imported.
 */
@moduleScoped(AwsApiGatewayModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class HttpApiEventMapper extends BaseApiEventMapper implements EventMapperInterface<HttpApiEventPayload | Request, HttpApiEventResponsePayload | Response> {

    /**
     * The Http api event mapper maps a raw event to EventsExecutionOptionsInterface with either an HttpApiEventPayload or a Request
     * depending on the handling strategy defined in the environment configs.
     * @param logHandler The log handler to output logs.
     * @param httpRequestsHandlingStrategy The handling strategy to use when handling http api events.
     */
    constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
                @inject("%" + AwsApiGatewayModuleKeyname + ".httpApiEvents.handlingStrategy%") private readonly httpRequestsHandlingStrategy: ApiGatewayEventsHandlingStrategyEnum) {
        super();
    }

    /**
     * Whether or not this mapper supports the raw event.
     * @param rawEvent The raw event that needs to be mapped.
     * @param executionContext The execution context in which the event is happening.
     */
    supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
        return rawEvent.hasOwnProperty("version") &&
            rawEvent.version === "2.0" &&
            rawEvent.hasOwnProperty("headers") &&
            rawEvent.hasOwnProperty("requestContext");
    }

    /**
     * Maps a raw event to EventsExecutionOptionsInterface with either an HttpApiEventPayload or a Request
     * depending on the handling strategy defined in the environment configs.
     * @param rawEvent The raw event that needs to be mapped.
     * @param executionContext The execution context in which the event is happening.
     */
    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<HttpApiEventPayload | Request> {
        switch(this.httpRequestsHandlingStrategy) {
            // If the handling strategy is request, we create an event with a request object from the raw event,
            // and set the execution order to sequential.
            case ApiGatewayEventsHandlingStrategyEnum.Request: {
                const request = new Request(
                    this.mapHttpMethod(rawEvent.requestContext.http.method),
                    rawEvent.requestContext.http.path + (rawEvent.rawQueryString ? "?" + rawEvent.rawQueryString : "")
                );
                request.setHeaders(rawEvent.headers);
                request.body = rawEvent.body;
                request.rawBody = rawEvent.body;

                return {
                    executionOrder: "sequential",
                    events: [new Event<Request>(ApiGatewayEventTypeEnum.HttpApiEvent, request)],
                };
            }

            // If the handling strategy is Event, we create an event with a HttpApiEventPayload from the raw event,
            // and set the execution order to sequential.
            case ApiGatewayEventsHandlingStrategyEnum.Event: {
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
                    httpRequestEventPayload.requestContext = {
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
    }

    /**
     * Whether or not this mapper supports reverse mapping an event response to a
     * @param eventResponse The pristine event response to be reverse mapped.
     * @param response The final response being built from all the mappers that support this type of event response.
     * @param executionContext The execution context in which the event was handled.
     */
    supportsReverseMapping(eventResponse: EventResponse<HttpApiEventPayload | Request, HttpApiEventResponsePayload | Response>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        return eventResponse.event.type === ApiGatewayEventTypeEnum.HttpApiEvent;
    }

    /**
     * Reverse maps a Pristine event response into an HttpApiEventResponsePayload to be returned to Api Gateway.
     * @param eventResponse The pristine event response to be reverse mapped.
     * @param response The final response being built from all the mappers that support this type of event response. It's possible to add on to a response from another mapper.
     * @param executionContext The execution context in which the event was handled.
     */
    reverseMap(eventResponse: EventResponse<HttpApiEventPayload | Request, HttpApiEventResponsePayload | Response>, response: any, executionContext: ExecutionContextInterface<any>): HttpApiEventResponsePayload {
        if(eventResponse.response instanceof HttpApiEventResponsePayload) {
            return eventResponse.response;
        } else if(eventResponse.response instanceof Response) {
            let body = eventResponse.response.body;

            if(body !== null && typeof body === "object") {
                try {
                    body = JSON.stringify(body);
                }
                catch (e: any) {
                    this.logHandler.error("HttpApiEventMapper: Could not convert the response body into a string by stringifying it as a JSON.", {
                        highlights: {
                          errorMessage: e?.message ?? "Unknown error",
                          body,
                        },
                        extra: {
                            error: e,
                        }
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
