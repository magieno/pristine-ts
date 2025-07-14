import "reflect-metadata"
import {LogHandlerMock} from "../../../../tests/mocks/log.handler.mock";
import { HttpMethod, Request, Response } from "@pristine-ts/common";
import { DefaultContentTypeResponseHeaderInterceptor } from "./default-content-type-response-header.interceptor";

describe("Default Content Type response header Interceptor", () => {
    const logHandlerMock = new LogHandlerMock()

    it("should return the unmodified response if the interceptor is not active", async () => {
        const defaultContentTypeResponseHeaderInterceptor: DefaultContentTypeResponseHeaderInterceptor = new DefaultContentTypeResponseHeaderInterceptor("application/json", false, logHandlerMock);

        const response = new Response();
        const request = new Request(HttpMethod.Get, "http://localhost", "uuid");

        expect((await defaultContentTypeResponseHeaderInterceptor.interceptResponse(response, request)).hasHeader("Content-Type")).toBeFalsy();
    })

    it("should return the unmodified response if the Content-Type is already present in the Response", async () => {
        const defaultContentTypeResponseHeaderInterceptor: DefaultContentTypeResponseHeaderInterceptor = new DefaultContentTypeResponseHeaderInterceptor("application/json", true, logHandlerMock);

        const response = new Response();
        const request = new Request(HttpMethod.Get, "http://localhost", "uuid");
        response.setHeader("Content-Type", "text/plain")

        expect((await defaultContentTypeResponseHeaderInterceptor.interceptResponse(response, request)).getHeader("Content-Type")).toBe("text/plain");
    })

    it("should return the response with the header Content-Type set to application/json", async () => {
        const defaultContentTypeResponseHeaderInterceptor: DefaultContentTypeResponseHeaderInterceptor = new DefaultContentTypeResponseHeaderInterceptor("application/json", true, logHandlerMock);

        const response = new Response();
        const request = new Request(HttpMethod.Get, "http://localhost", "uuid");

        expect((await defaultContentTypeResponseHeaderInterceptor.interceptResponse(response, request)).getHeader("Content-Type")).toBe("application/json");
    })
})
