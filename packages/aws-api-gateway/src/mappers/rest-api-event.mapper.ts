import {HttpMethod, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
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
import {Request, Response} from "@pristine-ts/networking";
import {AwsApiGatewayModuleKeyname} from "../aws-api-gateway.module.keyname";
import {BaseApiEventMapper} from "./base-api-event.mapper";

@moduleScoped(AwsApiGatewayModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class RestApiEventMapper extends BaseApiEventMapper implements EventMapperInterface<RestApiEventPayload | Request, RestApiEventResponsePayload | Response> {
    constructor(@inject("%" + AwsApiGatewayModuleKeyname + ".rest_api_events.handling_strategy%") private readonly restApiEventsHandlingStrategy: ApiGatewayEventsHandlingStrategyEnum) {
        super();
    }

    supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
        return executionContext.keyname === ExecutionContextKeynameEnum.AwsLambda &&
            rawEvent.hasOwnProperty("version") &&
            rawEvent.version === "1.0" &&
            rawEvent.hasOwnProperty("resource") &&
            rawEvent.hasOwnProperty("path") &&
            rawEvent.hasOwnProperty("httpMethod") &&
            rawEvent.hasOwnProperty("headers");
    }

    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<RestApiEventPayload | Request> {

        switch (this.restApiEventsHandlingStrategy) {
            case ApiGatewayEventsHandlingStrategyEnum.Request:
                const request = new Request({
                    url: rawEvent.path,
                    httpMethod: this.mapHttpMethod(rawEvent.httpMethod),
                    headers: rawEvent.headers,
                    body: rawEvent.body,
                    rawBody: rawEvent.body,
                })

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
                        resourceId: rawEvent.requestContext.resourceId,
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
                            cognitoIdentityPoolId: rawEvent.requestContext.identity?.cognitoIdentityPoolId,
                            accountId: rawEvent.requestContext.identity?.accountId,
                            cognitoIdentityId: rawEvent.requestContext.identity?.cognitoIdentityId,
                            caller: rawEvent.requestContext.identity?.caller,
                            sourceIp: rawEvent.requestContext.identity?.sourceIp,
                            principalOrgId: rawEvent.requestContext.identity?.principalOrgId,
                            accessKey: rawEvent.requestContext.identity?.accessKey,
                            cognitoAuthenticationType: rawEvent.requestContext.identity?.cognitoAuthenticationType,
                            cognitoAuthenticationProvider: rawEvent.requestContext.identity?.cognitoAuthenticationProvider,
                            userArn: rawEvent.requestContext.identity?.userArn,
                            userAgent: rawEvent.requestContext.identity?.userAgent,
                            user: rawEvent.requestContext.identity?.user,
                            clientCert: rawEvent.requestContext.identity.clientCert,
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
            return {
                statusCode: eventResponse.response.status,
                headers: eventResponse.response.headers ?? {},
                body: eventResponse.response.body,
                isBase64Encoded: false,
            } as RestApiEventResponsePayload;
        }
    }

}
