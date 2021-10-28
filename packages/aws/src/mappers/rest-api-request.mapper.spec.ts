import "reflect-metadata"
import {HttpRequestMapper} from "./http-request.mapper";
import {MethodMapper} from "./method.mapper";
import {HttpMethod} from "@pristine-ts/common";
import {RequestInterface} from "@pristine-ts/common";
import {RestApiRequestMapper} from "./rest-api-request.mapper";

describe("Rest api request mapper", () => {
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    const rawEvent = {
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

    it("should map a rest api request properly", () => {
        const restApiRequestMapper = new RestApiRequestMapper(new MethodMapper());

        const expectedRequest: RequestInterface = {
            url: "/my/path",
            body: rawEvent.body,
            rawBody: rawEvent.body,
            headers: {
                "header1": "value1",
                "header2": "value2"
            },
            httpMethod: HttpMethod.Get
        }

        // @ts-ignore
        expect(restApiRequestMapper.map(rawEvent)).toEqual(expectedRequest);
    })
})
