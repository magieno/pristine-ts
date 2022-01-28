import {HttpMethod, Request, Response} from "@pristine-ts/common";
import {RestApiEventMapper} from "./rest-api-event.mapper";
import {ApiGatewayEventsHandlingStrategyEnum} from "../enums/api-gateway-events-handling-strategy.enum";
import {RestApiEventPayload} from "../event-payloads/rest-api.event-payload";
import {ApiGatewayEventTypeEnum} from "../enums/api-gateway-event-type.enum";
import {map} from "lodash";
import {EventResponse} from "@pristine-ts/core";
import {RestApiEventResponsePayload} from "../event-response-payloads/rest-api.event-response-payload";
import {LogHandlerMock} from "../../../../tests/mocks/log.handler.mock";

describe("Rest API Event (Api Gateway 1.0)", () => {
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    const executionContext = {keyname: "", context: {}};
    const rawEvent: any = {
        "version": "1.0",
        "resource": "/my/path",
        "path": "/my/path",
        "httpMethod": "GET",
        "headers": {
            "header1": "value1",
            "header2": "value2"
        },
        "multiValueHeaders": {
            "header1": [
                "value1"
            ],
            "header2": [
                "value1",
                "value2"
            ]
        },
        "queryStringParameters": {
            "parameter1": "value1",
            "parameter2": "value"
        },
        "multiValueQueryStringParameters": {
            "parameter1": [
                "value1",
                "value2"
            ],
            "parameter2": [
                "value"
            ]
        },
        "requestContext": {
            "accountId": "123456789012",
            "apiId": "id",
            "authorizer": {
                "claims": null,
                "scopes": null
            },
            "domainName": "id.execute-api.us-east-1.amazonaws.com",
            "domainPrefix": "id",
            "extendedRequestId": "request-id",
            "httpMethod": "GET",
            "identity": {
                "accessKey": null,
                "accountId": null,
                "caller": null,
                "cognitoAuthenticationProvider": null,
                "cognitoAuthenticationType": null,
                "cognitoIdentityId": null,
                "cognitoIdentityPoolId": null,
                "principalOrgId": null,
                "sourceIp": "IP",
                "user": null,
                "userAgent": "user-agent",
                "userArn": null,
                "clientCert": {
                    "clientCertPem": "CERT_CONTENT",
                    "subjectDN": "www.example.com",
                    "issuerDN": "Example issuer",
                    "serialNumber": "a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1",
                    "validity": {
                        "notBefore": "May 28 12:30:02 2019 GMT",
                        "notAfter": "Aug  5 09:36:04 2021 GMT"
                    }
                }
            },
            "path": "/my/path",
            "protocol": "HTTP/1.1",
            "requestId": "id=",
            "requestTime": "04/Mar/2020:19:15:17 +0000",
            "requestTimeEpoch": 1583349317135,
            "resourceId": null,
            "resourcePath": "/my/path",
            "stage": "$default"
        },
        "pathParameters": null,
        "stageVariables": null,
        "body": JSON.stringify({ message: "Hello from Lambda"}),
        "isBase64Encoded": false
    };

    it("should map a rest api request into a Request Object", () => {
        const restApiRequestMapper = new RestApiEventMapper(new LogHandlerMock(), ApiGatewayEventsHandlingStrategyEnum.Request);

        expect(restApiRequestMapper.supportsMapping(rawEvent, executionContext));

        const expectedRequest: Request = new Request(HttpMethod.Get, "/my/path");
        expectedRequest.body = rawEvent.body;
        expectedRequest.rawBody = rawEvent.body,
        expectedRequest.headers = {
            "header1": "value1",
            "header2": "value2"
        };

        const mappedEvent = restApiRequestMapper.map(rawEvent, executionContext);

        expect(mappedEvent.executionOrder).toBe("sequential");
        expect(mappedEvent.events.length).toBe(1);
        expect(mappedEvent.events[0].type).toBe(ApiGatewayEventTypeEnum.RestApiEvent);
        expect(mappedEvent.events[0].payload instanceof Request).toBeTruthy()
        expect(mappedEvent.events[0].payload).toEqual(expectedRequest);


        // Reverse map
        const response = new Response();
        response.status = 201;
        response.headers = {"Content-Type": "application/json"}
        response.body = {"allo": true}

        const eventResponse = new EventResponse(mappedEvent.events[0], response);

        expect(restApiRequestMapper.supportsReverseMapping(eventResponse, {}, executionContext)).toBeTruthy();

        const mappedResponse = restApiRequestMapper.reverseMap(eventResponse, {}, executionContext) as RestApiEventResponsePayload;
        expect(mappedResponse instanceof RestApiEventResponsePayload).toBeTruthy()
        expect(mappedResponse.statusCode).toBe(201)
        expect(mappedResponse.headers).toStrictEqual({"Content-Type": "application/json"})
        expect(mappedResponse.body).toStrictEqual('{"allo":true}')
        expect(mappedResponse.isBase64Encoded).toBeFalsy()
    })


    it("should map a rest api request properly into an Event Object and should reverse map it properly", () => {
        const restApiRequestMapper = new RestApiEventMapper(new LogHandlerMock(), ApiGatewayEventsHandlingStrategyEnum.Event);

        expect(restApiRequestMapper.supportsMapping(rawEvent, executionContext));

        const mappedEvent = restApiRequestMapper.map(rawEvent, executionContext);

        const expectedEvent = new RestApiEventPayload("1.0", "/my/path", "/my/path", "GET")

        expectedEvent.headers = {
            "header1": "value1",
                "header2": "value2"
        };
        expectedEvent.multiValueHeaders = {
            "header1": [
                "value1"
            ],
                "header2": [
                "value1",
                "value2"
            ]
        };
        expectedEvent.queryStringParameters = {
            "parameter1": "value1",
                "parameter2": "value"
        };

        expectedEvent.multiValueQueryStringParameters = {
            "parameter1": [
                "value1",
                "value2"
            ],
                "parameter2": [
                "value"
            ]
        };

        expectedEvent.requestContext = {
            "accountId": "123456789012",
                "apiId": "id",
                "authorizer": {
                "claims": null,
                    "scopes": null
            },
            "domainName": "id.execute-api.us-east-1.amazonaws.com",
                "domainPrefix": "id",
                "extendedRequestId": "request-id",
                "httpMethod": "GET",
                "identity": {
                "accessKey": undefined,
                    "accountId": undefined,
                    "caller": undefined,
                    "cognitoAuthenticationProvider": undefined,
                    "cognitoAuthenticationType": undefined,
                    "cognitoIdentityId": undefined,
                    "cognitoIdentityPoolId": undefined,
                    "principalOrgId": undefined,
                    "sourceIp": "IP",
                    "user": undefined,
                    "userAgent": "user-agent",
                    "userArn": undefined,
                    "clientCert": {
                    "clientCertPem": "CERT_CONTENT",
                        "subjectDN": "www.example.com",
                        "issuerDN": "Example issuer",
                        "serialNumber": "a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1",
                        "validity": {
                        "notBefore": "May 28 12:30:02 2019 GMT",
                            "notAfter": "Aug  5 09:36:04 2021 GMT"
                    }
                }
            },
            "path": "/my/path",
                "protocol": "HTTP/1.1",
                "requestId": "id=",
                "requestTime": "04/Mar/2020:19:15:17 +0000",
                "requestTimeEpoch": 1583349317135,
                "resourceId": undefined,
                "resourcePath": "/my/path",
                "stage": "$default"
        };
        expectedEvent.pathParameters = {};
        expectedEvent.stageVariables = {};
        expectedEvent.body = JSON.stringify({ message: "Hello from Lambda"});
        expectedEvent.isBase64Encoded = false;

        expect(mappedEvent.executionOrder).toBe("sequential")
        expect(mappedEvent.events.length).toBe(1);
        expect(mappedEvent.events[0].type).toBe(ApiGatewayEventTypeEnum.RestApiEvent)
        expect(mappedEvent.events[0].payload instanceof RestApiEventPayload).toBeTruthy()
        expect(mappedEvent.events[0].payload).toEqual(expectedEvent);

        // Reverse map
        const restApiEventResponsePayload = new RestApiEventResponsePayload(200)
        const eventResponse = new EventResponse(mappedEvent.events[0], restApiEventResponsePayload);

        expect(restApiRequestMapper.supportsReverseMapping(eventResponse, {}, executionContext)).toBeTruthy();

        const mappedResponse = restApiRequestMapper.reverseMap(eventResponse, {}, executionContext);
        expect(mappedResponse instanceof RestApiEventResponsePayload).toBeTruthy()
    })

})
