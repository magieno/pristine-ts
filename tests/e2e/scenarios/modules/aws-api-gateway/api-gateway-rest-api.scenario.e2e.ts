import {
    CoreModule,
    Event,
    EventHandlerInterface,
    EventResponse,
    ExecutionContextKeynameEnum,
    Kernel
} from "@pristine-ts/core";
import {AppModuleInterface, HttpMethod, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {container, injectable} from "tsyringe";
import {
    ApiGatewayEventsHandlingStrategyEnum,
    AwsApiGatewayModule,
    RestApiEventPayload,
    RestApiEventResponsePayload
} from "@pristine-ts/aws-api-gateway";
import {AwsModule} from "@pristine-ts/aws";
import {controller, NetworkingModule, RequestMapper, route} from "@pristine-ts/networking";


describe("API Gateway Rest API (Event 1.0) scenarios", () => {
    beforeEach(() => {
        container.clearInstances()
    })

    it("should :" +
        "- Transform the raw http api event into an RestApiEventPayload" +
        "- Trigger the EventListeners and EventHandlers" +
        "- Return a proper Api Gateway Response", async() => {

        @tag(ServiceDefinitionTagEnum.EventHandler)
        @injectable()
        class RestApiEventHandler implements EventHandlerInterface<RestApiEventPayload, RestApiEventResponsePayload> {
            async handle(event: Event<RestApiEventPayload>): Promise<EventResponse<RestApiEventPayload, RestApiEventResponsePayload>> {
                const responsePayload = new RestApiEventResponsePayload(201, "Great Scott!");

                return new EventResponse(event, responsePayload);
            }

            supports<T>(event: Event<T>): boolean {
                return true;
            }

        }


        const appModule: AppModuleInterface = {
            keyname: "test.module",
            importModules: [
                AwsApiGatewayModule,
                AwsModule,
                CoreModule
            ],
            importServices: [],
        }

        const kernel = new Kernel();
        await kernel.start(appModule, {
            "pristine.logging.consoleLoggerActivated" : false,
            "pristine.logging.fileLoggerActivated" : false,
            "pristine.aws-api-gateway.restApiEvents.handlingStrategy": ApiGatewayEventsHandlingStrategyEnum.Event,
        });

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

        const response: RestApiEventResponsePayload = await kernel.handle(rawEvent, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: {}}) as RestApiEventResponsePayload;

        // Take a real Api Gateway Event and test it
        expect( response instanceof Response).toBeFalsy();
        expect(response instanceof RestApiEventResponsePayload).toBeTruthy();

        expect(response.statusCode).toBe(201);
        expect(response.body).toBe("Great Scott!");
    })

    it("should:" +
        "- Transform the raw http api event into a Request" +
        "- Transform the HttpApiEventPayload into a RequestEvent and re-trigger a dispatch", async() => {
        // Take a real Api Gateway Event and test it
        @controller("/my/path")
        @injectable()
        class MyPathController {
            @route(HttpMethod.Get, "")
            get() {
                return "Nice Path!";
            }
        }

        const appModule: AppModuleInterface = {
            keyname: "test.module",
            importModules: [
                AwsApiGatewayModule,
                AwsModule,
                CoreModule,
                NetworkingModule,
            ],
            importServices: [],
        }

        const kernel = new Kernel();

        await kernel.start(appModule, {
            "pristine.logging.consoleLoggerActivated" : false,
            "pristine.logging.fileLoggerActivated" : false,
            "pristine.aws-api-gateway.restApiEvents.handlingStrategy": ApiGatewayEventsHandlingStrategyEnum.Request,
        });

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

        const response: RestApiEventResponsePayload = await kernel.handle(rawEvent, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: {}}) as RestApiEventResponsePayload;

        // Take a real Api Gateway Event and test it
        expect( response instanceof Response).toBeFalsy();
        expect(response instanceof RestApiEventResponsePayload).toBeTruthy();

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe("Nice Path!");
    })
})
