import {HttpMethod, RequestInterface} from "@pristine-ts/common";
import {RestApiEventMapper} from "./rest-api-event.mapper";
import {ApiGatewayEventsHandlingStrategyEnum} from "../enums/api-gateway-events-handling-strategy.enum";
import {Request} from "@pristine-ts/networking";
import {RestApiEventPayload} from "../event-payloads/rest-api.event-payload";
import {ApiGatewayEventTypeEnum} from "../enums/api-gateway-event-type.enum";
import {map} from "lodash";

describe("Rest API Event (Api Gateway 1.0)", () => {
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
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
        const restApiRequestMapper = new RestApiEventMapper(ApiGatewayEventsHandlingStrategyEnum.Request);

        const expectedRequest: Request = new Request({
            url: "/my/path",
            body: rawEvent.body,
            rawBody: rawEvent.body,
            headers: {
                "header1": "value1",
                "header2": "value2"
            },
            httpMethod: HttpMethod.Get
        });

        const mappedEvent = restApiRequestMapper.map(rawEvent, {keyname: "", context: {}});

        expect(mappedEvent.executionOrder).toBe("sequential");
        expect(mappedEvent.events.length).toBe(1);
        expect(mappedEvent.events[0].type).toBe(ApiGatewayEventTypeEnum.RestApiEvent);
        expect(mappedEvent.events[0].payload instanceof Request).toBeTruthy()
        expect(mappedEvent.events[0].payload).toEqual(expectedRequest);
    })


    it("should map a rest api request properly into an Event Object", () => {
        const restApiRequestMapper = new RestApiEventMapper(ApiGatewayEventsHandlingStrategyEnum.Event);

        const restApiEventPayload: RestApiEventPayload = new RestApiEventPayload("1.0", "/my/path", "/my/path", "GET");

        const mappedEvent = restApiRequestMapper.map(rawEvent, {keyname: "", context: {}});

        const eventPayload: RestApiEventPayload = mappedEvent.events[0].payload as RestApiEventPayload;

        eventPayload.headers = {
            "header1": "value1",
                "header2": "value2"
        };
        eventPayload.multiValueHeaders = {
            "header1": [
                "value1"
            ],
                "header2": [
                "value1",
                "value2"
            ]
        };
        eventPayload.queryStringParameters = {
            "parameter1": "value1",
                "parameter2": "value"
        };

        eventPayload.multiValueQueryStringParameters = {
            "parameter1": [
                "value1",
                "value2"
            ],
                "parameter2": [
                "value"
            ]
        };

        eventPayload.requestContext = {
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
        eventPayload.pathParameters = {};
        eventPayload.stageVariables = {};
        eventPayload.body = JSON.stringify({ message: "Hello from Lambda"});
        eventPayload.isBase64Encoded = false;

        expect(mappedEvent.executionOrder).toBe("sequential")
        expect(mappedEvent.events.length).toBe(1);
        expect(mappedEvent.events[0].type).toBe(ApiGatewayEventTypeEnum.RestApiEvent)
        expect(mappedEvent.events[0].payload instanceof RestApiEventPayload).toBeTruthy()
        expect(mappedEvent.events[0].payload).toEqual(eventPayload);
    })

    it("should reverse map into a Response Object", () => {
        throw new Error("");
    });
    it("should reverse map into the ApiGateway expected response", () => {
        throw new Error("");
    });
})
