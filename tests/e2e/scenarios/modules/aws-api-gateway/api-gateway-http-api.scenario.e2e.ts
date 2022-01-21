import {AppModuleInterface, HttpMethod, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {
    CoreModule,
    Event,
    EventHandlerInterface,
    EventResponse,
    ExecutionContextKeynameEnum,
    Kernel
} from "@pristine-ts/core";
import {container, injectable} from "tsyringe";
import {
    ApiGatewayEventsHandlingStrategyEnum,
    AwsApiGatewayModule, HttpApiEventPayload, HttpApiEventResponsePayload,
    RestApiEventPayload,
    RestApiEventResponsePayload
} from "@pristine-ts/aws-api-gateway";
import {AwsModule} from "@pristine-ts/aws";
import {controller, NetworkingModule, route} from "@pristine-ts/networking";

describe("API Gateway HTTP API (Event 2.0) scenarios", () => {
    it("should :" +
        "- Transform the raw http api event into an HttpApiEventPayload" +
        "- Trigger the EventListeners and EventHandlers" +
        "- Return a proper Api Gateway Response", async() => {


        @tag(ServiceDefinitionTagEnum.EventHandler)
        @injectable()
        class HttpApiEventHandler implements EventHandlerInterface<HttpApiEventPayload, HttpApiEventResponsePayload> {
            async handle(event: Event<HttpApiEventPayload>): Promise<EventResponse<HttpApiEventPayload, HttpApiEventResponsePayload>> {
                const responsePayload = new HttpApiEventResponsePayload(201, "Great Scott!");

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
            "pristine.aws-api-gateway.http_api_events.handling_strategy": ApiGatewayEventsHandlingStrategyEnum.Event,
        });

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

        const response: HttpApiEventResponsePayload = await kernel.handle(rawEvent, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: {}}) as HttpApiEventResponsePayload;

        // Take a real Api Gateway Event and test it
        expect( response instanceof Response).toBeFalsy();
        expect(response instanceof HttpApiEventResponsePayload).toBeTruthy();

        expect(response.statusCode).toBe(201);
        expect(response.body).toBe("Great Scott!");
    })

    it("should:" +
        "- Transform the raw http api event into a Request" +
        "- Transform the HttpApiEventPayload into a RequestEvent and reach the Controller", async() => {
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
            "pristine.aws-api-gateway.http_api_events.handling_strategy": ApiGatewayEventsHandlingStrategyEnum.Request,
        });

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
                    "method": "GET",
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

        const response: HttpApiEventResponsePayload = await kernel.handle(rawEvent, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: {}}) as HttpApiEventResponsePayload;

        // Take a real Api Gateway Event and test it
        expect( response instanceof Response).toBeFalsy();
        expect(response instanceof HttpApiEventResponsePayload).toBeTruthy();

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe("Nice Path!");
    })
})
