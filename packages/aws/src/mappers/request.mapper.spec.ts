import "reflect-metadata"
import {HttpRequestMapper} from "./http-request.mapper";
import {HttpMethod} from "@pristine-ts/common";
import {RequestInterface} from "@pristine-ts/common";
import {MethodMapper} from "./method.mapper";
import {RequestMapper} from "./request.mapper";
import {RequestMapperFactory} from "../factories/request-mapper.factory";
import {RestApiRequestMapper} from "./rest-api-request.mapper";
import {LogHandlerInterface} from "@pristine-ts/logging";


const logHandlerMock: LogHandlerInterface = {
    debug(message: string, extra?: any) {
    },
    info(message: string, extra?: any) {
    },
    error(message: string, extra?: any) {
    }
    ,critical(message: string, extra?: any) {
    },
    warning(message: string, extra?: any) {
    },
}

describe("Request mapper", () => {
    const rawRestEvent = {
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
        "body": "Hello from Lambda!",
        "isBase64Encoded": false
    };

    const rawHttpEvent = {
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
            "header2": "value2"
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
        "body": "Hello from Lambda",
        "pathParameters": {
            "parameter1": "value1"
        },
        "isBase64Encoded": false,
        "stageVariables": {
            "stageVariable1": "value1",
            "stageVariable2": "value2"
        }
    };

    it("should map a rest request properly", () => {
        const methodMapper = new MethodMapper();
        const requestMapper = new RequestMapper(new RequestMapperFactory(new HttpRequestMapper(methodMapper), new RestApiRequestMapper(methodMapper)), logHandlerMock);

        const expectedRequest: RequestInterface = {
            url: "/my/path",
            body: rawRestEvent.body,
            rawBody: rawRestEvent.body,
            headers: {
                "header1": "value1",
                "header2": "value2"
            },
            httpMethod: HttpMethod.Get
        }

        // @ts-ignore
        expect(requestMapper.map(rawRestEvent)).toEqual(expectedRequest);
    })

    it("should map an http request properly", () => {
        const methodMapper = new MethodMapper();
        const requestMapper = new RequestMapper(new RequestMapperFactory(new HttpRequestMapper(methodMapper), new RestApiRequestMapper(methodMapper)), logHandlerMock);

        const expectedRequest: RequestInterface = {
            url: "/my/path?parameter1=value1&parameter1=value2&parameter2=value",
            body: rawHttpEvent.body,
            rawBody: rawHttpEvent.body,
            headers: {
                "header1": "value1",
                "header2": "value2"
            },
            httpMethod: HttpMethod.Post
        }
        expect(requestMapper.map(rawHttpEvent)).toEqual(expectedRequest);
    })

})
