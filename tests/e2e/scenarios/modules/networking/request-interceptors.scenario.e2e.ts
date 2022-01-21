import {HttpError, RequestInterceptorInterface, Route, RouterInterface} from "@pristine-ts/networking";
import {
    AppModuleInterface,
    HttpMethod,
    ModuleInterface,
    Request,
    Response, ServiceDefinitionTagEnum,
} from "@pristine-ts/common";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {injectable, DependencyContainer, InjectionToken} from "tsyringe";

describe("Networking - Request Interceptors", () => {
    it("should call the request interceptors", async (done) => {
        expect(false).toBeTruthy()
    });

    it("should call the response interceptors", async (done) => {
        expect(false).toBeTruthy()
    });

    it("should call the error response interceptors and properly return the intercepted error response", async (done) => {
        expect(false).toBeTruthy()
    });

    it("should call the response interceptors after the error response interceptors and properly return the intercepted response", async (done) => {
        expect(false).toBeTruthy()
    });

    // it("should call the request interceptors and properly pass the intercepted request to the router", async (done) => {
    //     @injectable()
    //     class RequestInterceptor implements RequestInterceptorInterface {
    //         interceptRequest(request: Request): Promise<Request> {
    //             request.setHeader("test1", "test1");
    //
    //             return Promise.resolve(request);
    //         }
    //     }
    //
    //     const module: AppModuleInterface = {
    //         keyname: "test",
    //         importModules: [
    //             CoreModule,
    //         ],
    //         providerRegistrations: [
    //             {
    //                 token: ServiceDefinitionTagEnum.RequestInterceptor,
    //                 useToken: RequestInterceptor,
    //             }
    //         ],
    //         importServices: [],
    //     };
    //
    //     const router: RouterInterface = {
    //         setup(): void {
    //         },
    //         register: (path: string, method: HttpMethod | string, route: Route) => {
    //         },
    //         execute: (request: Request, container: DependencyContainer): Promise<Response> => {
    //
    //             expect(request.hasHeader("test1")).toBeTruthy()
    //             expect(request.getHeader("test1")).toBe("test1");
    //
    //             done();
    //
    //             return Promise.resolve({
    //                 status: 200,
    //                 request,
    //             })
    //         }
    //     }
    //
    //     const kernel = new Kernel();
    //     await kernel.start(module, {
    //         "pristine.logging.consoleLoggerActivated": false,
    //         "pristine.logging.fileLoggerActivated": false,
    //     });
    //
    //     const oldResolveMethod = kernel.container.resolve;
    //     kernel.container.resolve = (token: InjectionToken<any>): any => {
    //         if(token === "RouterInterface") {
    //             return router;
    //         }
    //
    //         return oldResolveMethod(token);
    //     }
    //
    //     await kernel.handle(new Request(HttpMethod.Get, ""), {keyname: ExecutionContextKeynameEnum.Jest, context: {}});
    // })
    //
    // it("should call the response interceptors and properly return the intercepted response", async (done) => {
    //     @injectable()
    //     class ResponseInterceptor implements RequestInterceptorInterface {
    //         interceptResponse(response: Response, request: Request): Promise<Response> {
    //             response.status = 204;
    //             response.body = {
    //                 "test1": "test1",
    //             }
    //
    //             done();
    //             return Promise.resolve(response);
    //         }
    //     }
    //
    //     const module: AppModuleInterface = {
    //         keyname: "test",
    //
    //         importModules: [
    //             CoreModule,
    //         ],
    //         providerRegistrations: [
    //             {
    //                 token: ServiceDefinitionTagEnum.RequestInterceptor,
    //                 useToken: ResponseInterceptor,
    //             }
    //         ],
    //         importServices: [],
    //     };
    //
    //     const router: RouterInterface = {
    //         setup() {
    //         },
    //         register: (path: string, method: HttpMethod | string, route: Route) => {
    //         },
    //         execute: (request: Request, container: DependencyContainer): Promise<Response> => {
    //             const response: Response = new Response();
    //             response.status = 200;
    //             response.body = {};
    //
    //             return Promise.resolve(response);
    //         }
    //     }
    //
    //     const kernel = new Kernel();
    //     await kernel.start(module, {
    //         "pristine.logging.consoleLoggerActivated": false,
    //         "pristine.logging.fileLoggerActivated": false,
    //     });
    //
    //     const oldResolveMethod = kernel.container.resolve;
    //     kernel.container.resolve = (token: InjectionToken<any>): any => {
    //         if(token === "RouterInterface") {
    //             return router;
    //         }
    //
    //         return oldResolveMethod(token);
    //     }
    //
    //     const response = await kernel.handleRequest({url: "", httpMethod: HttpMethod.Get});
    //
    //     expect(response.status).toBe(204);
    //     expect(response.body.test1).toBeDefined();
    //     expect(response.body.test1).toBe("test1");
    // })
    //
    // it("should call the error response interceptors and properly return the intercepted error response", async (done) => {
    //     @injectable()
    //     class ErrorResponseInterceptor implements ErrorResponseInterceptorInterface {
    //         interceptError(error: Error, request: Request, response?: Response): Promise<Response> {
    //             const interceptedErrorResponse = new Response();
    //
    //             if (error instanceof HttpError) {
    //
    //                 interceptedErrorResponse.status = (error as HttpError).httpStatus;
    //                 interceptedErrorResponse.body = {
    //                     "message": error.message,
    //                 }
    //
    //                 done();
    //             }
    //
    //             return Promise.resolve(interceptedErrorResponse);
    //         }
    //     }
    //
    //     const module: ModuleInterface = {
    //         keyname: "test",
    //
    //         importModules: [
    //             CoreModule,
    //         ],
    //         providerRegistrations: [
    //             {
    //                 token: ServiceDefstartionTagEnum.ErrorResponseInterceptor,
    //                 useToken: ErrorResponseInterceptor,
    //             }
    //         ]
    //     };
    //
    //     const router: RouterInterface = {
    //         register: (path: string, method: HttpMethod | string, route: Route) => {
    //         },
    //         execute: (request: Request, container: DependencyContainer): Promise<Response> => {
    //             throw new HttpError(500, "Error Message")
    //         }
    //     }
    //
    //     const kernel = new Kernel();
    //     await kernel.start(module, {
    //         "pristine.logging.consoleLoggerActivated": false,
    //         "pristine.logging.fileLoggerActivated": false,
    //     });
    //     // Force set the router
    //     kernel["router"] = router;
    //     const response = await kernel.handleRequest({url: "", httpMethod: HttpMethod.Get});
    //
    //     expect(response.status).toBe(500);
    //     expect(response.body.message).toBeDefined();
    //     expect(response.body.message).toBe("Error Message");
    // })
    //
    // it("should call the response interceptors after the error response interceptors and properly return the intercepted response", async (done) => {
    //     @injectable()
    //     class ResponseInterceptor implements ResponseInterceptorInterface {
    //         interceptResponse(response: Response, request: Request): Promise<Response> {
    //             expect(response.status).toBe(500);
    //             expect(response.body.message).toBeDefined();
    //             expect(response.body.message).toBe("Error Message");
    //
    //             if (response.headers === undefined) {
    //                 response.headers = {};
    //             }
    //
    //             response.headers["test1"] = "test1";
    //             return Promise.resolve(response);
    //         }
    //     }
    //
    //     @injectable()
    //     class ErrorResponseInterceptor implements ErrorResponseInterceptorInterface {
    //         interceptError(error: Error, request: Request, response?: Response): Promise<Response> {
    //             const interceptedErrorResponse = new Response();
    //
    //             if (error instanceof HttpError) {
    //
    //                 interceptedErrorResponse.status = (error as HttpError).httpStatus;
    //                 interceptedErrorResponse.body = {
    //                     "message": error.message,
    //                 }
    //             }
    //
    //             return Promise.resolve(interceptedErrorResponse);
    //         }
    //     }
    //
    //     const module: ModuleInterface = {
    //         keyname: "test",
    //
    //         importModules: [
    //             CoreModule,
    //         ],
    //         providerRegistrations: [
    //             {
    //                 token: ServiceDefstartionTagEnum.ErrorResponseInterceptor,
    //                 useToken: ErrorResponseInterceptor,
    //             },
    //             {
    //                 token: ServiceDefstartionTagEnum.ResponseInterceptor,
    //                 useToken: ResponseInterceptor,
    //             }
    //         ]
    //     };
    //
    //     const router: RouterInterface = {
    //         register: (path: string, method: HttpMethod | string, route: Route) => {
    //         },
    //         execute: (request: Request, container: DependencyContainer): Promise<Response> => {
    //             throw new HttpError(500, "Error Message")
    //         }
    //     }
    //
    //     const kernel = new Kernel();
    //     await kernel.start(module, {
    //         "pristine.logging.consoleLoggerActivated": false,
    //         "pristine.logging.fileLoggerActivated": false,
    //     });
    //     // Force set the router
    //     kernel["setupRouter"] = () => {
    //         kernel["router"] = router
    //     };
    //     const response = await kernel.handleRequest({url: "", httpMethod: HttpMethod.Get});
    //
    //     // @ts-ignore
    //     expect(response.headers.test1).toBe("test1");
    //
    //     done();
    // })

});