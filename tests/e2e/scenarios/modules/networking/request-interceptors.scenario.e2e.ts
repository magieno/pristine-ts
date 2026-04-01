import {MethodRouterNode, RequestInterceptorInterface, RequestMapper} from "@pristine-ts/networking";
import {HttpMethod, Request, Response, ServiceDefinitionTagEnum, tag,} from "@pristine-ts/common";
import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {injectable} from "tsyringe";
import {testModule} from "../../../src/test.module";

const higherPriority = 600;
const lowerPriority = 50;

@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@injectable()
class RequestInterceptor implements RequestInterceptorInterface {
    priority = higherPriority;
    async interceptRequest(request: Request, methodeNode: MethodRouterNode): Promise<Request> {
        expect(request.body.requestInterceptorsThatHaveBeenExecutedAlready).toBeUndefined();

        request.body = {
            requestIntercepted: true,
            requestInterceptorsThatHaveBeenExecutedAlready: ["RequestInterceptor"],
        }
        return request;
    }

    async interceptResponse(response: Response, request: Request, methodNode?: MethodRouterNode): Promise<Response> {
        expect(response.body.responseInterceptorsThatHaveBeenExecutedAlready).toBeUndefined();

        response.body.responseInterceptorsThatHaveBeenExecutedAlready = ["RequestInterceptor"]
        response.status = 102;
        return response;
    }

    async interceptError(error: Error, response: Response, request: Request, methodNode?: MethodRouterNode): Promise<Response> {
        expect(response.body.errorInterceptorsThatHaveBeenExecutedAlready).toBeUndefined();

        response.status = 500;
        response.body = {
            errorIntercepted: true,
            errorInterceptorsThatHaveBeenExecutedAlready: ["RequestInterceptor"],
        }
        return response;
    }
}

@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@injectable()
class RequestInterceptor2 implements RequestInterceptorInterface {

    priority = lowerPriority;

    async interceptRequest(request: Request, methodeNode: MethodRouterNode): Promise<Request> {
        expect(request.body.requestInterceptorsThatHaveBeenExecutedAlready).toBeDefined();
        expect(Array.isArray(request.body.requestInterceptorsThatHaveBeenExecutedAlready)).toBeTruthy();
        expect(request.body.requestInterceptorsThatHaveBeenExecutedAlready.length).toBe(1);
        expect(request.body.requestInterceptorsThatHaveBeenExecutedAlready[0]).toBe("RequestInterceptor");

        request.body.requestInterceptorsThatHaveBeenExecutedAlready.push("RequestInterceptor2");

        return request;
    }

    async interceptResponse(response: Response, request: Request, methodNode?: MethodRouterNode): Promise<Response> {
        expect(response.body.responseInterceptorsThatHaveBeenExecutedAlready).toBeDefined();
        expect(Array.isArray(response.body.responseInterceptorsThatHaveBeenExecutedAlready)).toBeTruthy();
        expect(response.body.responseInterceptorsThatHaveBeenExecutedAlready.length).toBe(1);
        expect(response.body.responseInterceptorsThatHaveBeenExecutedAlready[0]).toBe("RequestInterceptor");

        response.body.responseInterceptorsThatHaveBeenExecutedAlready.push("RequestInterceptor2");

        return response;
    }

    async interceptError(error: Error, response: Response, request: Request, methodNode?: MethodRouterNode): Promise<Response> {
        expect(response.body.errorInterceptorsThatHaveBeenExecutedAlready).toBeDefined();
        expect(Array.isArray(response.body.errorInterceptorsThatHaveBeenExecutedAlready)).toBeTruthy();
        expect(response.body.errorInterceptorsThatHaveBeenExecutedAlready.length).toBe(1);
        expect(response.body.errorInterceptorsThatHaveBeenExecutedAlready[0]).toBe("RequestInterceptor");

        response.body.errorInterceptorsThatHaveBeenExecutedAlready.push("RequestInterceptor2");

        return response;
    }
}

describe("Networking - Request Interceptors", () => {
    const kernel = new Kernel();

    beforeAll(async () => {
        await kernel.start(testModule, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        })
    })

    it("should call the request and response interceptors", async () => {
        const request = new Request(HttpMethod.Put, "/api/2.0/services/uniqueId", "uuid")

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response

        expect(response.body).toStrictEqual({
            requestIntercepted: true,
            requestInterceptorsThatHaveBeenExecutedAlready: ["RequestInterceptor", "RequestInterceptor2"],
            responseInterceptorsThatHaveBeenExecutedAlready: ["RequestInterceptor", "RequestInterceptor2"]
        })
        expect(response.status).toStrictEqual(102)
    });

    it("should call the error response interceptors, then call the response interceptors and finally properly return the intercepted error response", async () => {
        const request = new Request(HttpMethod.Put, "/api/2.0/errorThrown", "uuid")

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response

        expect(response.status).toStrictEqual(102) // If the response interceptor is not called after the error response interceptor, this would be 500
        expect(response.body).toStrictEqual({
            errorIntercepted: true,
            responseInterceptorsThatHaveBeenExecutedAlready: ["RequestInterceptor", "RequestInterceptor2"],
            errorInterceptorsThatHaveBeenExecutedAlready: ["RequestInterceptor", "RequestInterceptor2"],
        })
    });
});