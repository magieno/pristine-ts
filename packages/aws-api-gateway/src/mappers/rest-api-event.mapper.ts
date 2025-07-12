import {moduleScoped, Request, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {
    Event,
    EventMapperInterface,
    EventResponse,
    EventsExecutionOptionsInterface,
    ExecutionContextInterface,
    ExecutionContextKeynameEnum
} from "@pristine-ts/core";
import {RestApiEventResponsePayload} from "../event-response-payloads/rest-api.event-response-payload";
import {RestApiEventPayload} from "../event-payloads/rest-api.event-payload";
import {ApiGatewayEventTypeEnum} from "../enums/api-gateway-event-type.enum";
import {ApiGatewayEventsHandlingStrategyEnum} from "../enums/api-gateway-events-handling-strategy.enum";
import {AwsApiGatewayModuleKeyname} from "../aws-api-gateway.module.keyname";
import {BaseApiEventMapper} from "./base-api-event.mapper";
import {LogHandlerInterface} from "@pristine-ts/logging";

/**
 * The Rest api event mapper maps a raw event to EventsExecutionOptionsInterface with either an RestApiEventResponsePayload or a Request
 * depending on the handling strategy defined in the environment configs.
 * It is tagged as an ServiceDefinitionTagEnum.EventMapper so that it can be injected with all the other event mappers.
 * It is module scoped so that it gets injected only if the AWS-Api-Gateway module is imported.
 */
@moduleScoped(AwsApiGatewayModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class RestApiEventMapper extends BaseApiEventMapper implements EventMapperInterface<RestApiEventPayload | Request, RestApiEventResponsePayload | Response> {

    /**
     * The Http api event mapper maps a raw event to EventsExecutionOptionsInterface with either an RestApiEventResponsePayload or a Request
     * depending on the handling strategy defined in the environment configs.
     * @param logHandler The log handler to output logs.
     * @param restApiEventsHandlingStrategy The handling strategy to use when handling rest api events.
     */
    constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
                @inject("%" + AwsApiGatewayModuleKeyname + ".restApiEvents.handlingStrategy%") private readonly restApiEventsHandlingStrategy: ApiGatewayEventsHandlingStrategyEnum) {
        super();
    }

    /**
     * Whether or not this mapper supports the raw event.
     * @param rawEvent The raw event that needs to be mapped.
     * @param executionContext The execution context in which the event is happening.
     */
    supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
        return executionContext.keyname === ExecutionContextKeynameEnum.AwsLambda &&
            rawEvent.hasOwnProperty("version") &&
            rawEvent.version === "1.0" &&
            rawEvent.hasOwnProperty("resource") &&
            rawEvent.hasOwnProperty("path") &&
            rawEvent.hasOwnProperty("httpMethod") &&
            rawEvent.hasOwnProperty("headers");
    }

    /**
     * Maps a raw event to EventsExecutionOptionsInterface with either an RestApiEventPayload or a Request
     * depending on the handling strategy defined in the environment configs.
     * @param rawEvent The raw event that needs to be mapped.
     * @param executionContext The execution context in which the event is happening.
     */
    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<RestApiEventPayload | Request> {
        switch (this.restApiEventsHandlingStrategy) {
            case ApiGatewayEventsHandlingStrategyEnum.Request:
                const request = new Request(this.mapHttpMethod(rawEvent.httpMethod), rawEvent.path);
                request.setHeaders(rawEvent.headers);
                request.body = rawEvent.body;
                request.rawBody = rawEvent.body;

                return {
                    executionOrder: "sequential",
                    events: [new Event<Request>(ApiGatewayEventTypeEnum.RestApiEvent, request)],
                };

            case ApiGatewayEventsHandlingStrategyEnum.Event:
                const restApiEventPayload = new RestApiEventPayload(rawEvent.version, rawEvent.resource, rawEvent.path, rawEvent.httpMethod);
                restApiEventPayload.headers = rawEvent.headers;

                restApiEventPayload.multiValueHeaders = rawEvent.multiValueHeaders;
                restApiEventPayload.queryStringParameters = rawEvent.queryStringParameters;
                restApiEventPayload.multiValueQueryStringParameters = rawEvent.multiValueQueryStringParameters;
                restApiEventPayload.pathParameters = rawEvent.pathParameters ?? {};
                restApiEventPayload.stageVariables = rawEvent.stageVariables ?? {};
                restApiEventPayload.body = rawEvent.body;
                restApiEventPayload.isBase64Encoded = rawEvent.isBase64Encoded;
                if (rawEvent.hasOwnProperty("requestContext")) {
                    restApiEventPayload.requestContext = {
                        resourceId: rawEvent.requestContext.resourceId ?? undefined,
                        resourcePath: rawEvent.requestContext.resourcePath,
                        httpMethod: rawEvent.requestContext.httpMethod,
                        extendedRequestId: rawEvent.requestContext.extendedRequestId,
                        requestTime: rawEvent.requestContext.requestTime,
                        path: rawEvent.requestContext.path,
                        accountId: rawEvent.requestContext.accountId,
                        protocol: rawEvent.requestContext.protocol,
                        stage: rawEvent.requestContext.stage,
                        domainPrefix: rawEvent.requestContext.domainPrefix,
                        requestTimeEpoch: rawEvent.requestContext.requestTimeEpoch,
                        requestId: rawEvent.requestContext.requestId,
                        domainName: rawEvent.requestContext.domainName,
                        apiId: rawEvent.requestContext.apiId,
                        authorizer: rawEvent.requestContext.authorizer,
                        identity: {
                            cognitoIdentityPoolId: rawEvent.requestContext.identity?.cognitoIdentityPoolId ?? undefined,
                            accountId: rawEvent.requestContext.identity?.accountId ?? undefined,
                            cognitoIdentityId: rawEvent.requestContext.identity?.cognitoIdentityId ?? undefined,
                            caller: rawEvent.requestContext.identity?.caller ?? undefined,
                            sourceIp: rawEvent.requestContext.identity?.sourceIp ?? undefined,
                            principalOrgId: rawEvent.requestContext.identity?.principalOrgId ?? undefined,
                            accessKey: rawEvent.requestContext.identity?.accessKey ?? undefined,
                            cognitoAuthenticationType: rawEvent.requestContext.identity?.cognitoAuthenticationType ?? undefined,
                            cognitoAuthenticationProvider: rawEvent.requestContext.identity?.cognitoAuthenticationProvider ?? undefined,
                            userArn: rawEvent.requestContext.identity?.userArn ?? undefined,
                            userAgent: rawEvent.requestContext.identity?.userAgent ?? undefined,
                            user: rawEvent.requestContext.identity?.user ?? undefined,
                            clientCert: rawEvent.requestContext.identity.clientCert ?? undefined,
                        }
                    }
                }

                return {
                    executionOrder: "sequential",
                    events: [new Event<RestApiEventPayload>(ApiGatewayEventTypeEnum.RestApiEvent, restApiEventPayload)],
                };
        }

    }

    supportsReverseMapping(eventResponse: EventResponse<RestApiEventPayload | Request, RestApiEventResponsePayload | Response>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        return eventResponse.event.type === ApiGatewayEventTypeEnum.RestApiEvent;
    }

    reverseMap(eventResponse: EventResponse<RestApiEventPayload | Request, RestApiEventResponsePayload | Response>, response: any, executionContext: ExecutionContextInterface<any>): any {
        if(eventResponse.response instanceof RestApiEventResponsePayload) {
            return eventResponse.response;
        } else if(eventResponse.response instanceof Response) {
            let body = eventResponse.response.body;

            if(body !== null && typeof body === "object") {
                try {
                    body = JSON.stringify(body);
                }
                catch (e) {
                    this.logHandler.error("RestApiEventMapper: Could not convert the response body into a string by stringifying it as a JSON.", {
                        extra: {
                            error: e,
                            body,
                        }
                    }, AwsApiGatewayModuleKeyname)
                }
            }

            const restApiEventResponsePayload = new RestApiEventResponsePayload(eventResponse.response.status, body);
            if(eventResponse.response.headers) {
                restApiEventResponsePayload.headers = eventResponse.response.headers;
            }
            restApiEventResponsePayload.isBase64Encoded = false;

            return restApiEventResponsePayload;
        } else {
            return new RestApiEventResponsePayload(200, eventResponse.response);
        }
    }
}
