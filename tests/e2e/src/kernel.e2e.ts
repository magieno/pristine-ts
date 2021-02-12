import "reflect-metadata"
import {ResolvedClassModel} from "./models/resolved-class.model";
import {testModule} from "./test.module";
import {PermissionManager} from "./managers/permission.manager";
import {container, DependencyContainer, inject, injectable, singleton} from "tsyringe";
import {
    HttpMethod,
    Request,
    Response,
    Route,
    RouterInterface,
    HttpError,
    NetworkingModule,
} from "@pristine-ts/networking";
import {ServiceDefinitionTagEnum, ModuleInterface} from "@pristine-ts/common";
import {
    Kernel,
    RequestInterceptorInterface,
    ResponseInterceptorInterface,
    ErrorResponseInterceptorInterface,
    CoreModule,
} from "@pristine-ts/core";
import {TestGuard} from "./guards/test.guard";

describe("Kernel.ts", () => {
    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })

    it("should test the Kernel", async () => {
        const kernel = new Kernel();
        await kernel.init(testModule);

        const resolvedClassModel = kernel.container.resolve<ResolvedClassModel>(ResolvedClassModel);
        const permissionManager = kernel.container.resolveAll(PermissionManager)

        // const response = await kernel.handleRequest(request);


        expect(resolvedClassModel.getRandomNumber()).toBeGreaterThan(0);
    })

    it("should load the controllers", async () => {
        const kernel = new Kernel();
        await kernel.init(testModule);

        // await kernel.handleRequest({
        //     url: "https://localhost:8080/api/2.0/services",
        //     httpMethod: HttpMethod.Get,
        // });

        await kernel.handleRequest({
            url: "https://localhost:8080/api/2.0/services/0a931a57-c238-4d07-ab5e-e51b10320997",
            httpMethod: HttpMethod.Put,
            body: {
                specialBody: "body"
            }
        });

        const a = 0;
    })

    it("should call the request interceptors and properly pass the intercepted request to the router", async (done) => {
        @injectable()
        class RequestInterceptor implements RequestInterceptorInterface {
            interceptRequest(request: Request): Promise<Request> {
                request.setHeader("test1", "test1");

                return Promise.resolve(request);
            }
        }

        const module: ModuleInterface = {
            keyname: "test",
            importModules: [
                CoreModule,
            ],
            importServices: [],
            providerRegistrations: [
                {
                    token: ServiceDefinitionTagEnum.RequestInterceptor,
                    useToken: RequestInterceptor,
                }
            ]
        };

        const router: RouterInterface = {
            register: (path: string, method: HttpMethod | string, route: Route) => {
            },
            execute: (request: Request, container: DependencyContainer): Promise<Response> => {

                expect(request.hasHeader("test1")).toBeTruthy()
                expect(request.getHeader("test1")).toBe("test1");

                done();

                return Promise.resolve({
                    status: 200,
                    request,
                })
            }
        }

        const kernel = new Kernel();
        await kernel.init(module);
        // Force set the router
        kernel["router"] = router;
        await kernel.handleRequest({url: "", httpMethod: HttpMethod.Get});
    })

    it("should call the response interceptors and properly return the intercepted response", async (done) => {
        @injectable()
        class ResponseInterceptor implements ResponseInterceptorInterface {
            interceptResponse(response: Response, request: Request): Promise<Response> {
                response.status = 204;
                response.body = {
                    "test1": "test1",
                }

                done();
                return Promise.resolve(response);
            }
        }

        const module: ModuleInterface = {
            keyname: "test",
            importServices: [],
            importModules: [
                CoreModule,
            ],
            providerRegistrations: [
                {
                    token: ServiceDefinitionTagEnum.ResponseInterceptor,
                    useToken: ResponseInterceptor,
                }
            ]
        };

        const router: RouterInterface = {
            register: (path: string, method: HttpMethod | string, route: Route) => {
            },
            execute: (request: Request, container: DependencyContainer): Promise<Response> => {
                const response: Response = new Response();
                response.status = 200;
                response.body = {};

                return Promise.resolve(response);
            }
        }

        const kernel = new Kernel();
        await kernel.init(module);
        // Force set the router
        kernel["router"] = router;
        const response = await kernel.handleRequest({url: "", httpMethod: HttpMethod.Get});

        expect(response.status).toBe(204);
        expect(response.body.test1).toBeDefined();
        expect(response.body.test1).toBe("test1");
    })

    it("should call the error response interceptors and properly return the intercepted error response", async (done) => {
        @injectable()
        class ErrorResponseInterceptor implements ErrorResponseInterceptorInterface {
            interceptError(error: Error, request: Request, response?: Response): Promise<Response> {
                const interceptedErrorResponse = new Response();

                if (error instanceof HttpError) {

                    interceptedErrorResponse.status = (error as HttpError).httpStatus;
                    interceptedErrorResponse.body = {
                        "message": error.message,
                    }

                    done();
                }

                return Promise.resolve(interceptedErrorResponse);
            }
        }

        const module: ModuleInterface = {
            keyname: "test",
            importServices: [],
            importModules: [
                CoreModule,
            ],
            providerRegistrations: [
                {
                    token: ServiceDefinitionTagEnum.ErrorResponseInterceptor,
                    useToken: ErrorResponseInterceptor,
                }
            ]
        };

        const router: RouterInterface = {
            register: (path: string, method: HttpMethod | string, route: Route) => {
            },
            execute: (request: Request, container: DependencyContainer): Promise<Response> => {
                throw new HttpError(500, "Error Message")
            }
        }

        const kernel = new Kernel();
        await kernel.init(module);
        // Force set the router
        kernel["router"] = router;
        const response = await kernel.handleRequest({url: "", httpMethod: HttpMethod.Get});

        expect(response.status).toBe(500);
        expect(response.body.message).toBeDefined();
        expect(response.body.message).toBe("Error Message");
    })

    it("should call the response interceptors after the error response interceptors and properly return the intercepted response", async (done) => {
        @injectable()
        class ResponseInterceptor implements ResponseInterceptorInterface {
            interceptResponse(response: Response, request: Request): Promise<Response> {
                expect(response.status).toBe(500);
                expect(response.body.message).toBeDefined();
                expect(response.body.message).toBe("Error Message");

                if (response.headers === undefined) {
                    response.headers = {};
                }

                response.headers["test1"] = "test1";
                return Promise.resolve(response);
            }
        }

        @injectable()
        class ErrorResponseInterceptor implements ErrorResponseInterceptorInterface {
            interceptError(error: Error, request: Request, response?: Response): Promise<Response> {
                const interceptedErrorResponse = new Response();

                if (error instanceof HttpError) {

                    interceptedErrorResponse.status = (error as HttpError).httpStatus;
                    interceptedErrorResponse.body = {
                        "message": error.message,
                    }
                }

                return Promise.resolve(interceptedErrorResponse);
            }
        }

        const module: ModuleInterface = {
            keyname: "test",
            importServices: [],
            importModules: [
                CoreModule,
            ],
            providerRegistrations: [
                {
                    token: ServiceDefinitionTagEnum.ErrorResponseInterceptor,
                    useToken: ErrorResponseInterceptor,
                },
                {
                    token: ServiceDefinitionTagEnum.ResponseInterceptor,
                    useToken: ResponseInterceptor,
                }
            ]
        };

        const router: RouterInterface = {
            register: (path: string, method: HttpMethod | string, route: Route) => {
            },
            execute: (request: Request, container: DependencyContainer): Promise<Response> => {
                throw new HttpError(500, "Error Message")
            }
        }

        const kernel = new Kernel();
        await kernel.init(module);
        // Force set the router
        kernel["router"] = router;
        const response = await kernel.handleRequest({url: "", httpMethod: HttpMethod.Get});

        // @ts-ignore
        expect(response.headers.test1).toBe("test1");

        done();
    })

    it("should register all the parameters in the container", async () => {
        interface ConfigurationDefinitionInterface {
            test1Parameter: string;
            test2Parameter?: string;
        }

        class ConfigurationDefinition implements ConfigurationDefinitionInterface{
            test1Parameter: string = "test1";
            test2Parameter: string = "test2";
        }

        const module: ModuleInterface = {
            keyname: "test",
            importServices: [],
            importModules: [
                CoreModule,
            ],
            providerRegistrations: [
            ],
            configurationDefinition: ConfigurationDefinition
        };

        const kernel = new Kernel();
        await kernel.init(module, [{
            moduleKeyname: "test",
            configuration: {
                test1Parameter: "NotDefault",
            },
        }]);

        expect(kernel.container.resolve("%test.test1Parameter%")).toBe("NotDefault")
        expect(kernel.container.resolve("%test.test2Parameter%")).toBe("test2")
    })

    it("should inject a configuration parameter in a class if you use the right token", async () => {
        interface ConfigurationDefinitionInterface {
            test1Parameter: string;
            test2Parameter?: string;
        }

        class ConfigurationDefinition implements ConfigurationDefinitionInterface{
            test1Parameter: string = "test1";
            test2Parameter: string = "test2";
        }

        const module: ModuleInterface = {
            keyname: "test",
            importServices: [],

            importModules: [
                CoreModule,
            ],
            providerRegistrations: [
            ],
            configurationDefinition: ConfigurationDefinition
        };

        @injectable()
        class TestConfigurationParameterInjectedInConstructor {
            public constructor(@inject("%test.test1Parameter%") public readonly test1Parameter: string, @inject("%test.test2Parameter%") public readonly test2Parameter: string,) {
            }
        }

        const kernel = new Kernel();
        await kernel.init(module, [{
            moduleKeyname: "test",
            configuration: {
                test1Parameter: "NotDefault",
            },
        }]);

        const instance = kernel.container.resolve(TestConfigurationParameterInjectedInConstructor);
        expect(instance.test1Parameter).toBe("NotDefault");
        expect(instance.test2Parameter).toBe("test2");
    })
})