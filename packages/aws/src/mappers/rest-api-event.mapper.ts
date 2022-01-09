import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {AwsModuleKeyname} from "../aws.module.keyname";
import {injectable} from "tsyringe";
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
import {RestApiRequestModel} from "../models/rest-api-request.model";
import {RestApiEventTypeEnum} from "../enums/rest-api-event-type.enum";
import {RestApiRequestContextModel} from "../models/rest-api-request-context.model";

@moduleScoped(AwsModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class RestApiEventMapper implements EventMapperInterface<RestApiEventPayload, RestApiEventResponsePayload> {
    supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
        return executionContext.keyname === ExecutionContextKeynameEnum.AwsLambda &&
            rawEvent.hasOwnProperty("version") &&
            rawEvent.version === "1.0";
    }

    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<RestApiEventPayload> {


        const restApiRequestModel = new RestApiEventPayload();
        restApiRequestModel.version = rawEvent.version;
        restApiRequestModel.resource = rawEvent.resource;
        restApiRequestModel.path = rawEvent.path;
        restApiRequestModel.httpMethod = rawEvent.httpMethod;
        restApiRequestModel.headers = rawEvent.headers;

        restApiRequestModel.multiValueHeaders = rawEvent.multiValueHeaders;
        restApiRequestModel.queryStringParameters = rawEvent.queryStringParameters;
        restApiRequestModel.multiValueQueryStringParameters = rawEvent.multiValueQueryStringParameters;
        restApiRequestModel.pathParameters = rawEvent.pathParameters;
        restApiRequestModel.stageVariables = rawEvent.stageVariables;
        restApiRequestModel.body = rawEvent.body;
        restApiRequestModel.isBase64Encoded = rawEvent.isBase64Encoded;
        if (rawEvent.hasOwnProperty("requestContext")) {
            restApiRequestModel.requestContext = {
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


        const event = new Event<RestApiRequestModel>(RestApiEventTypeEnum.Request, restApiRequestModel);

        return {
            executionOrder: "parallel",
            events: [event],
        };
    }

    supportsReverseMapping(eventResponse: EventResponse<RestApiEventPayload, RestApiEventResponsePayload>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        return eventResponse.event.payload instanceof RestApiEventPayload;
    }

    reverseMap(eventResponse: EventResponse<RestApiEventPayload, RestApiEventResponsePayload>, response: any, executionContext: ExecutionContextInterface<any>) {
        return eventResponse.response;
    }

}
