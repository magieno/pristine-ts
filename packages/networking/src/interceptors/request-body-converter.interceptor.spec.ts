import "reflect-metadata"
import {LogHandlerMock} from "../../../../tests/mocks/log.handler.mock";
import {RequestBodyConverterInterceptor} from "./request-body-converter.interceptor";
import {HttpMethod, Request} from "@pristine-ts/common";
import {InvalidBodyHttpError} from "../errors/invalid-body.http-error";

describe("Request Body Converter Interceptor", () => {
    const logHandlerMock = new LogHandlerMock()

    it("should return the unmodified request if the interceptor is not active", async () => {
        const requestBodyConverterInterceptor: RequestBodyConverterInterceptor = new RequestBodyConverterInterceptor(false, logHandlerMock);

        const request = new Request(HttpMethod.Get, "http://localhost", "uuid")
        const stringifiedRequest = JSON.stringify(request);

        expect(JSON.stringify(await requestBodyConverterInterceptor.interceptRequest(request))).toStrictEqual(stringifiedRequest);
    })

    it("should return the unmodified request if the Content-Type is not present in the Request", async () => {
        const requestBodyConverterInterceptor: RequestBodyConverterInterceptor = new RequestBodyConverterInterceptor(true, logHandlerMock);

        const request = new Request(HttpMethod.Get, "http://localhost", "uuid")
        const stringifiedRequest = JSON.stringify(request);

        expect(JSON.stringify(await requestBodyConverterInterceptor.interceptRequest(request))).toStrictEqual(stringifiedRequest);
    })

    it("should return the unmodified request if the Content-Type is application/json and the type of the body is 'undefined'", async () => {
        const requestBodyConverterInterceptor: RequestBodyConverterInterceptor = new RequestBodyConverterInterceptor(true, logHandlerMock);

        const request = new Request(HttpMethod.Get, "http://localhost", "uuid")
        request.setHeader("Content-Type", "application/json")
        request.body = undefined;

        const stringifiedRequest = JSON.stringify(request);

        const interceptedRequest = await requestBodyConverterInterceptor.interceptRequest(request);
        expect(interceptedRequest.hasHeader("Content-Type")).toBeTruthy()
        expect(interceptedRequest.getHeader("Content-Type")).toBe("application/json")
        expect(JSON.stringify(interceptedRequest)).toStrictEqual(stringifiedRequest);
    })

    it("should return the unmodified request if the Content-Type is application/json and the type of the body is an object", async () => {
        const requestBodyConverterInterceptor: RequestBodyConverterInterceptor = new RequestBodyConverterInterceptor(true, logHandlerMock);

        const request = new Request(HttpMethod.Get, "http://localhost", "uuid")
        request.setHeader("Content-Type", "application/json")
        request.body = {
            allo: true,
        };

        const stringifiedRequest = JSON.stringify(request);

        const interceptedRequest = await requestBodyConverterInterceptor.interceptRequest(request);
        expect(interceptedRequest.hasHeader("Content-Type")).toBeTruthy()
        expect(interceptedRequest.getHeader("Content-Type")).toBe("application/json")
        expect(JSON.stringify(interceptedRequest)).toStrictEqual(stringifiedRequest);
    })

    it("should parse the request body if the Content-Type is application/json and the type of the body is 'string'", async () => {
        const requestBodyConverterInterceptor: RequestBodyConverterInterceptor = new RequestBodyConverterInterceptor(true, logHandlerMock);

        const request = new Request(HttpMethod.Get, "http://localhost", "uuid")
        request.setHeader("Content-Type", "application/json")
        request.body = '{"allo": true}';

        const stringifiedRequest = JSON.stringify(request);

        const interceptedRequest = await requestBodyConverterInterceptor.interceptRequest(request);
        expect(interceptedRequest.hasHeader("Content-Type")).toBeTruthy()
        expect(interceptedRequest.getHeader("Content-Type")).toBe("application/json")
        expect(JSON.stringify(interceptedRequest)).not.toStrictEqual(stringifiedRequest);
        expect(interceptedRequest.body).toStrictEqual({allo: true});
    })

    it("should throw an error if the Content-Type is application/json and the type of the body is 'string' but the string is not valid JSON", async () => {
        const requestBodyConverterInterceptor: RequestBodyConverterInterceptor = new RequestBodyConverterInterceptor(true, logHandlerMock);

        const request = new Request(HttpMethod.Get, "http://localhost", "uuid")
        request.setHeader("Content-Type", "application/json")
        request.body = 'INVALID_JSON';

        return expect(requestBodyConverterInterceptor.interceptRequest(request)).rejects.toThrow(new InvalidBodyHttpError("RequestBodyConverterInterceptor: This request has the Content-Type header 'application/json', and the body is of type string, but the body contains invalid JSON."));
    })

    it("should throw an error if the Content-Type is application/json and the type of the body is 'boolean'", async () => {
        const requestBodyConverterInterceptor: RequestBodyConverterInterceptor = new RequestBodyConverterInterceptor(true, logHandlerMock);

        const request = new Request(HttpMethod.Get, "http://localhost", "uuid")
        request.setHeader("Content-Type", "application/json")
        request.body = true;

        return expect(requestBodyConverterInterceptor.interceptRequest(request)).rejects.toThrow(new InvalidBodyHttpError("RequestBodyConverterInterceptor: This request has the Content-Type header 'application/json' but the body contains invalid JSON."));
    })

    it("should throw an error if the Content-Type is application/json and the type of the body is 'number'", async () => {
        const requestBodyConverterInterceptor: RequestBodyConverterInterceptor = new RequestBodyConverterInterceptor(true, logHandlerMock);

        const request = new Request(HttpMethod.Get, "http://localhost", "uuid")
        request.setHeader("Content-Type", "application/json")
        request.body = 8766;

        return expect(requestBodyConverterInterceptor.interceptRequest(request)).rejects.toThrow(new InvalidBodyHttpError("RequestBodyConverterInterceptor: This request has the Content-Type header 'application/json' but the body contains invalid JSON."));
    })

    it("should throw an error if the Content-Type is application/json and the type of the body is 'Date'", async () => {
        const requestBodyConverterInterceptor: RequestBodyConverterInterceptor = new RequestBodyConverterInterceptor(true, logHandlerMock);

        const request = new Request(HttpMethod.Get, "http://localhost", "uuid")
        request.setHeader("Content-Type", "application/json")
        request.body = new Date();

        return expect(requestBodyConverterInterceptor.interceptRequest(request)).rejects.toThrow(new InvalidBodyHttpError("RequestBodyConverterInterceptor: This request has the Content-Type header 'application/json' but the body is a Date object which is invalid JSON."));
    })
})