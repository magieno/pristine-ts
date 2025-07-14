import {HttpApiEventMapper} from "./http-api-event.mapper";
import {ApiGatewayEventsHandlingStrategyEnum} from "../enums/api-gateway-events-handling-strategy.enum";
import {HttpMethod, Request, Response} from "@pristine-ts/common";
import {ApiGatewayEventTypeEnum} from "../enums/api-gateway-event-type.enum";
import {HttpApiEventPayload} from "../event-payloads/http-api.event-payload";
import {EventResponse} from "@pristine-ts/core";
import {HttpApiEventResponsePayload} from "../event-response-payloads/http-api.event-response-payload";
import {LogHandlerMock} from "../../../../tests/mocks/log.handler.mock";

describe("Http request mapper", () => {
    const executionContext = {keyname: "", context: {}};

    // https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    const rawEvent = {
        "version": "2.0",
        "routeKey": "$default",
        "rawPath": "/my/path",
        "rawQueryString": "parameter1=value1&parameter1=value2&parameter2=value",
        "cookies": [
            "cookie1",
            "cookie2"
        ],
        "headers": {
            "header1": "value1",
            "header2": "value2",
            "x-pristine-request-id": "uuid"
        },
        "queryStringParameters": {
            "parameter1": "value1,value2",
            "parameter2": "value"
        },
        "requestContext": {
            "accountId": "123456789012",
            "apiId": "api-id",
            "authentication": {
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
            "authorizer": {
                "jwt": {
                    "claims": {
                        "claim1": "value1",
                        "claim2": "value2"
                    },
                    "scopes": [
                        "scope1",
                        "scope2"
                    ]
                }
            },
            "domainName": "id.execute-api.us-east-1.amazonaws.com",
            "domainPrefix": "id",
            "http": {
                "method": "POST",
                "path": "/my/path",
                "protocol": "HTTP/1.1",
                "sourceIp": "IP",
                "userAgent": "agent"
            },
            "requestId": "id",
            "routeKey": "$default",
            "stage": "$default",
            "time": "12/Mar/2020:19:03:58 +0000",
            "timeEpoch": 1583348638390
        },
        "body": JSON.stringify({ message: "Hello from Lambda"}),
        "pathParameters": {
            "parameter1": "value1"
        },
        "isBase64Encoded": false,
        "stageVariables": {
            "stageVariable1": "value1",
            "stageVariable2": "value2"
        }
    };

    it("should map an http api request into a Request Object", () => {
        const httpApiEventMapper = new HttpApiEventMapper(new LogHandlerMock(), ApiGatewayEventsHandlingStrategyEnum.Request);

        expect(httpApiEventMapper.supportsMapping(rawEvent, executionContext));

        const expectedRequest: Request = new Request(HttpMethod.Post, "/my/path?parameter1=value1&parameter1=value2&parameter2=value", "uuid");
        expectedRequest.body = rawEvent.body;
        expectedRequest.rawBody = rawEvent.body,
        expectedRequest.setHeaders({
            "header1": "value1",
            "header2": "value2",
            "x-pristine-request-id": "uuid"
        });

        const mappedEvent = httpApiEventMapper.map(rawEvent, executionContext);

        expect(mappedEvent.executionOrder).toBe("sequential");
        expect(mappedEvent.events.length).toBe(1);
        expect(mappedEvent.events[0].type).toBe(ApiGatewayEventTypeEnum.HttpApiEvent);
        expect(mappedEvent.events[0].payload instanceof Request).toBeTruthy()
        expect(mappedEvent.events[0].payload).toEqual(expectedRequest);

        // Reverse map
        const response = new Response();
        response.status = 201;
        response.setHeaders({"Content-Type": "application/json"})
        response.body = {"allo": true}

        const eventResponse = new EventResponse(mappedEvent.events[0], response);

        expect(httpApiEventMapper.supportsReverseMapping(eventResponse, {}, executionContext)).toBeTruthy();

        const mappedResponse = httpApiEventMapper.reverseMap(eventResponse, {}, executionContext) as HttpApiEventResponsePayload;
        expect(mappedResponse instanceof HttpApiEventResponsePayload).toBeTruthy()
        expect(mappedResponse.statusCode).toBe(201)
        expect(mappedResponse.headers).toStrictEqual({"content-type": "application/json"})
        expect(mappedResponse.body).toStrictEqual('{"allo":true}')
        expect(mappedResponse.isBase64Encoded).toBeFalsy()

    })

    it("should map an http api request properly into an Event Object", () => {
        const httpApiEventMapper = new HttpApiEventMapper(new LogHandlerMock(), ApiGatewayEventsHandlingStrategyEnum.Event);

        expect(httpApiEventMapper.supportsMapping(rawEvent, executionContext));

        const mappedEvent = httpApiEventMapper.map(rawEvent, executionContext);

        const expectedEventPayload: HttpApiEventPayload = new HttpApiEventPayload("2.0", "$default", "/my/path");

        expectedEventPayload.rawQueryString = "parameter1=value1&parameter1=value2&parameter2=value";
        expectedEventPayload.cookies = [
            "cookie1",
            "cookie2"
        ];
        expectedEventPayload.headers = {
            "header1": "value1",
            "header2": "value2",
            "x-pristine-request-id": "uuid"
        };
        expectedEventPayload.queryStringParameters = {
            "parameter1": "value1,value2",
                "parameter2": "value"
        };

        expectedEventPayload.requestContext = {
            "accountId": "123456789012",
                "apiId": "api-id",
                "authentication": {
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
            "authorizer": {
                "jwt": {
                    "claims": {
                        "claim1": "value1",
                            "claim2": "value2"
                    },
                    "scopes": [
                        "scope1",
                        "scope2"
                    ]
                }
            },
            "domainName": "id.execute-api.us-east-1.amazonaws.com",
                "domainPrefix": "id",
                "http": {
                "method": "POST",
                    "path": "/my/path",
                    "protocol": "HTTP/1.1",
                    "sourceIp": "IP",
                    "userAgent": "agent"
            },
            "requestId": "id",
                "routeKey": "$default",
                "stage": "$default",
                "time": "12/Mar/2020:19:03:58 +0000",
                "timeEpoch": 1583348638390
        };

        expectedEventPayload.body = JSON.stringify({ message: "Hello from Lambda"});
        expectedEventPayload.pathParameters = {
            "parameter1": "value1"
        };
        expectedEventPayload.isBase64Encoded = false;
        expectedEventPayload.stageVariables = {
            "stageVariable1": "value1",
            "stageVariable2": "value2"
        }

        expect(mappedEvent.executionOrder).toBe("sequential")
        expect(mappedEvent.events.length).toBe(1);
        expect(mappedEvent.events[0].type).toBe(ApiGatewayEventTypeEnum.HttpApiEvent)
        expect(mappedEvent.events[0].payload instanceof HttpApiEventPayload).toBeTruthy()
        expect(mappedEvent.events[0].payload).toEqual(expectedEventPayload);

        // Reverse map
        const httpApiEventResponsePayload = new HttpApiEventResponsePayload(200)
        const eventResponse = new EventResponse(mappedEvent.events[0], httpApiEventResponsePayload);

        expect(httpApiEventMapper.supportsReverseMapping(eventResponse, {}, executionContext)).toBeTruthy();

        const mappedResponse = httpApiEventMapper.reverseMap(eventResponse, {}, executionContext);
        expect(mappedResponse instanceof HttpApiEventResponsePayload).toBeTruthy()
    });
})
