import "reflect-metadata"
import {createServer} from "http";
import {createServer as createServerHttps, globalAgent} from "https";
import {
    HttpClient,
    HttpRequestInterface,
    HttpRequestOptions,
    HttpResponseInterface,
    ResponseTypeEnum,
    HttpRequestInterceptorInterface,
    HttpResponseInterceptorInterface,
    HttpWrapper
} from "@pristine-ts/http";
import {HttpMethod} from "@pristine-ts/common";
import {readFileSync} from "fs";
import { v4 as uuidv4 } from 'uuid';
import spyOn = jest.spyOn;

describe("Http Client", () => {

    const runTest = async (server: any, protocolName: string) => {

        describe(`${protocolName} protocol`, () => {
            const host = 'localhost';
            const port = 0;

            const alreadySeen = {
                400: {},
                500: {}
            }
            server.on("request", (req: any, res: any) => {
                let data = '';


                req.on('data', (chunk: any) => {
                    data += chunk;
                });

                req.on('end', () => {
                    if(req.url.startsWith("/redirect")) {
                        res.writeHead(302, {
                            location: "/success-redirect"
                        });
                        res.headers

                        return res.end();
                    }

                    if(req.url.startsWith("/two-redirect")) {
                        res.writeHead(302, {
                            location: "/redirect"
                        });
                        res.headers

                        return res.end();
                    }

                    if(req.url.startsWith("/success-redirect")) {
                        res.writeHead(200);
                        const responseBody = {
                            "redirected": true,
                        };

                        res.write(JSON.stringify(responseBody))
                        return res.end();
                    }

                    if(req.url.startsWith("/error-400-success-on-retry")) {
                        res.writeHead(400);
                        const responseBody = {
                            "errorMessage": "There is an error",
                        };

                        res.write(JSON.stringify(responseBody))
                        return res.end();
                    }

                    if(req.url.startsWith("/error-400")) {
                        res.writeHead(400);
                        const responseBody = {
                            "errorMessage": "There is an error",
                        };

                        res.write(JSON.stringify(responseBody))
                        return res.end();
                    }

                    if(req.url.startsWith("/error-500-success-on-retry")) {

                        if(req.headers.hasOwnProperty("unique-id")) {
                            if(alreadySeen["500"].hasOwnProperty(req.headers["unique-id"])) {
                                res.writeHead(200);
                                const responseBody = {
                                    "retried": true,
                                };

                                res.write(JSON.stringify(responseBody))
                                return res.end();
                            }

                            // @ts-ignore
                            alreadySeen["500"][req.headers["unique-id"]] = true;
                        }

                        res.writeHead(500);
                        const responseBody = {
                            "errorMessage": "There is an error",
                        };

                        res.write(JSON.stringify(responseBody))
                        return res.end();
                    }


                    if(req.url.startsWith("/error-500")) {
                        res.writeHead(500);
                        const responseBody = {
                            "errorMessage": "There is an error",
                        };

                        res.write(JSON.stringify(responseBody))
                        return res.end();
                    }

                    res.writeHead(200);
                    const responseBody = {
                        headers: req.headers,
                        method: req.method,
                        body: data,
                    };

                    res.write(JSON.stringify(responseBody))
                    res.end();
                });

            })

            it("should make the request with the '" + protocolName + "' protocol", async () => {
                await new Promise<void>(resolve => {
                    server.listen(port, host, async () => {
                        // Make an HTTP call using the httpClient
                        const httpClient = new HttpClient(new HttpWrapper())
                        httpClient.defaultOptions.responseType = ResponseTypeEnum.Raw;
                        const requestBody = JSON.stringify({
                            keyname: "Value",
                        });
                        const response = await httpClient.request({
                            // @ts-ignore
                            url: `${protocolName}://localhost:` + server.address()!.port,
                            httpMethod: HttpMethod.Put,
                            headers: {
                                "Content-Type": "application/json",
                                "X-Token": "AuthorizationToken",
                            },
                            body: requestBody,
                        });

                        expect(response.status).toBe(200)

                        const parsedBody = JSON.parse(response.body);

                        expect(parsedBody.method).toBe(HttpMethod.Put);
                        expect(parsedBody.body).toBe(requestBody);
                        expect(parsedBody.headers["content-type"]).toBe("application/json");
                        expect(parsedBody.headers["x-token"]).toBe("AuthorizationToken");

                        server.close();
                        return resolve();
                    });
                })

                expect.assertions(5)
            })

            it("should return a JSON response type", async () => {
                await new Promise<void>(resolve => {
                    server.listen(port, host, async () => {
                        // Make an HTTP call using the httpClient
                        const httpClient = new HttpClient(new HttpWrapper())
                        httpClient.defaultOptions.responseType = ResponseTypeEnum.Json;
                        const requestBody = JSON.stringify({
                            keyname: "Value",
                        });
                        const response = await httpClient.request({
                            // @ts-ignore
                            url: `${protocolName}://localhost:` + server.address()!.port,
                            httpMethod: HttpMethod.Put,
                            headers: {
                                "Content-Type": "application/json",
                                "X-Token": "AuthorizationToken",
                            },
                            body: requestBody,
                        });

                        expect(response.status).toBe(200)

                        const parsedBody = response.body;

                        expect(parsedBody.method).toBe(HttpMethod.Put);
                        expect(JSON.parse(parsedBody.body).keyname).toBe("Value");
                        expect(parsedBody.headers["content-type"]).toBe("application/json");
                        expect(parsedBody.headers["x-token"]).toBe("AuthorizationToken");

                        server.close();
                        return resolve();
                    });
                })

                expect.assertions(5)
            })


            it("should follow the redirect if the options is set to true", async () => {
                await new Promise<void>(resolve => {
                    server.listen(port, host, async () => {
                        // Make an HTTP call using the httpClient
                        const httpClient = new HttpClient(new HttpWrapper())
                        httpClient.defaultOptions.responseType = ResponseTypeEnum.Json;
                        httpClient.defaultOptions.followRedirects = true;

                        const response = await httpClient.request({
                            // @ts-ignore
                            url: `${protocolName}://localhost:` + server.address()!.port + "/redirect",
                            httpMethod: HttpMethod.Put,
                            headers: {
                                "Content-Type": "application/json",
                                "X-Token": "AuthorizationToken",
                            },
                        });

                        expect(response.status).toBe(200)
                        expect(response.body.redirected).toBeTruthy()

                        server.close();
                        return resolve();
                    });
                })

                expect.assertions(2)
            });

            it("should not follow the redirect if the options is set to false", async () => {
                await new Promise<void>(resolve => {
                    server.listen(port, host, async () => {
                        // Make an HTTP call using the httpClient
                        const httpClient = new HttpClient(new HttpWrapper())
                        httpClient.defaultOptions.responseType = ResponseTypeEnum.Json;
                        httpClient.defaultOptions.followRedirects = false;

                        const response = await httpClient.request({
                            // @ts-ignore
                            url: `${protocolName}://localhost:` + server.address()!.port + "/redirect",
                            httpMethod: HttpMethod.Put,
                            headers: {
                                "Content-Type": "application/json",
                                "X-Token": "AuthorizationToken",
                            },
                        });

                        expect(response.status).toBe(302)

                        server.close();
                        return resolve();
                    });
                })

                expect.assertions(1)
            });

            it("should not follow the redirect if the options is set to true but has exceeded the maximum number of redirects", async () => {
                await new Promise<void>(resolve => {
                    server.listen(port, host, async () => {
                        // Make an HTTP call using the httpClient
                        const httpClient = new HttpClient(new HttpWrapper())
                        httpClient.defaultOptions.responseType = ResponseTypeEnum.Json;
                        httpClient.defaultOptions.followRedirects = false;
                        httpClient.defaultOptions.maximumNumberOfRedirects = 1;

                        const response = await httpClient.request({
                            // @ts-ignore
                            url: `${protocolName}://localhost:` + server.address()!.port + "/two-redirect",
                            httpMethod: HttpMethod.Put,
                            headers: {
                                "Content-Type": "application/json",
                                "X-Token": "AuthorizationToken",
                            },
                        });

                        expect(response.status).toBe(302)

                        server.close();
                        return resolve();
                    });
                })

                expect.assertions(1)
            });


            it("should retry the request if the response is an error and is retryable", async () => {
                await new Promise<void>(resolve => {
                    server.listen(port, host, async () => {
                        // Make an HTTP call using the httpClient
                        const httpClient = new HttpClient(new HttpWrapper())
                        httpClient.defaultOptions.responseType = ResponseTypeEnum.Json;
                        httpClient.defaultOptions.followRedirects = true;
                        httpClient.defaultOptions.isRetryable = (httpRequestInterface, httpResponseInterface) => true;
                        httpClient.defaultOptions.maximumNumberOfRetries = 3;

                        const response = await httpClient.request({
                            // @ts-ignore
                            url: `${protocolName}://localhost:` + server.address()!.port + "/error-500-success-on-retry",
                            httpMethod: HttpMethod.Put,
                            headers: {
                                "Content-Type": "application/json",
                                "X-Token": "AuthorizationToken",
                                "Unique-Id": uuidv4(),
                            },
                        });

                        expect(response.status).toBe(200)

                        server.close();
                        return resolve();
                    });
                })

                expect.assertions(1)
            });

            it("should not retry the request if the response is an error but not retryable", async () => {
                await new Promise<void>(resolve => {
                    server.listen(port, host, async () => {
                        // Make an HTTP call using the httpClient
                        const httpClient = new HttpClient(new HttpWrapper())
                        httpClient.defaultOptions.responseType = ResponseTypeEnum.Json;
                        httpClient.defaultOptions.followRedirects = true;
                        httpClient.defaultOptions.isRetryable = (httpRequestInterface, httpResponseInterface) => false;
                        httpClient.defaultOptions.maximumNumberOfRetries = 3;

                        const response = await httpClient.request({
                            // @ts-ignore
                            url: `${protocolName}://localhost:` + server.address()!.port + "/error-500-success-on-retry",
                            httpMethod: HttpMethod.Put,
                            headers: {
                                "Content-Type": "application/json",
                                "X-Token": "AuthorizationToken",
                                "Unique-Id": uuidv4(),
                            },
                        });

                        expect(response.status).toBe(500)

                        server.close();
                        return resolve();
                    });
                })

                expect.assertions(1)
            });

            it("should not retry the request if the response is an error, is retryable, but has exceeded the max number of retries", async () => {
                await new Promise<void>(resolve => {
                    server.listen(port, host, async () => {
                        // Make an HTTP call using the httpClient
                        const httpClient = new HttpClient(new HttpWrapper())
                        httpClient.defaultOptions.responseType = ResponseTypeEnum.Json;
                        httpClient.defaultOptions.followRedirects = true;
                        httpClient.defaultOptions.isRetryable = (httpRequestInterface, httpResponseInterface) => false;
                        httpClient.defaultOptions.maximumNumberOfRetries = 0;

                        const response = await httpClient.request({
                            // @ts-ignore
                            url: `${protocolName}://localhost:` + server.address()!.port + "/error-500-success-on-retry",
                            httpMethod: HttpMethod.Put,
                            headers: {
                                "Content-Type": "application/json",
                                "X-Token": "AuthorizationToken",
                                "Unique-Id": uuidv4(),
                            },
                        });

                        expect(response.status).toBe(500)
                        server.close();
                        return resolve();
                    });
                })

                expect.assertions(1)
            });


            it("should call all the request and response interceptors", async () => {
                class TestHttpRequestInterceptor implements HttpRequestInterceptorInterface, HttpResponseInterceptorInterface {
                    interceptRequest(request: HttpRequestInterface, options: HttpRequestOptions): Promise<HttpRequestInterface> {
                        return Promise.resolve(request);
                    }

                    interceptResponse(request: HttpRequestInterface, options: HttpRequestOptions, response: HttpResponseInterface): Promise<HttpResponseInterface> {
                        return Promise.resolve(response);
                    }
                }

                const testHttpRequestInterceptor:TestHttpRequestInterceptor = new TestHttpRequestInterceptor();

                const interceptRequestSpy = spyOn(testHttpRequestInterceptor, "interceptRequest")
                const interceptResponseSpy = spyOn(testHttpRequestInterceptor, "interceptResponse")

                await new Promise<void>(resolve => {
                    server.listen(port, host, async () => {
                        // Make an HTTP call using the httpClient
                        const httpClient = new HttpClient(new HttpWrapper(), [testHttpRequestInterceptor], [testHttpRequestInterceptor])
                        httpClient.defaultOptions.responseType = ResponseTypeEnum.Json;
                        const requestBody = JSON.stringify({
                            keyname: "Value",
                        });
                        const response = await httpClient.request({
                            // @ts-ignore
                            url: `${protocolName}://localhost:` + server.address()!.port,
                            httpMethod: HttpMethod.Put,
                            headers: {
                                "Content-Type": "application/json",
                                "X-Token": "AuthorizationToken",
                            },
                            body: requestBody,
                        });

                        expect(response.status).toBe(200)

                        expect(interceptRequestSpy).toHaveBeenCalled();
                        expect(interceptResponseSpy).toHaveBeenCalled()
                        server.close();
                        return resolve();
                    });
                })

                expect.assertions(3)
            });

        })

    }

    runTest(createServer(), 'http');

    // Https Tests
    globalAgent.options.rejectUnauthorized = false
    runTest(createServerHttps({
        key: readFileSync(__dirname + '/../files/localhost.key'),
        cert: readFileSync(__dirname + '/../files/localhost.crt'),
        rejectUnauthorized: false,
    }), 'https');

})
