import "reflect-metadata"
import {BodyValidationRequestInterceptor} from "./body-validation.request-interceptor";
import {MethodRouterNode, PathRouterNode, Request, Route} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";
import {IsDate, IsInt, Max, Min} from "class-validator";
import {LogHandlerInterface} from "@pristine-ts/logging";

describe("Body Validation Request Enricher", () => {
    const logHandlerMock: LogHandlerInterface = {
        critical(message: string, extra?: any): void {
        }, debug(message: string, extra?: any): void {
        }, error(message: string, extra?: any): void {
        }, info(message: string, extra?: any): void {
        }, warning(message: string, extra?: any): void {
        }
    }

    class BodyPayload {
        @IsInt()
        @Min(0)
        minimumValue: number = -1;

        @IsInt()
        @Max(10)
        maximumValue: number = -1;
    }

    it("should simply return the request if the bodyValidator is undefined", async () => {
        const bodyValidationRequestInterceptor = new BodyValidationRequestInterceptor(logHandlerMock);

        const request: Request = new Request({
            url: "url",
            headers: {},
            body: {},
            httpMethod: HttpMethod.Get,
        });

        const route: Route = new Route(null, "method");
        route.context = {}
        route.context.bodyValidator = undefined;

        const methodRouterNode: MethodRouterNode = new MethodRouterNode(new PathRouterNode("/"), HttpMethod.Get, route, 1)

        const returnedRequest = await bodyValidationRequestInterceptor.interceptRequest(request, methodRouterNode);

        expect(returnedRequest).toBe(request);
    })

    it("should simply return the request if the classType is undefined", async () => {
        const bodyValidationRequestEnricher = new BodyValidationRequestInterceptor(logHandlerMock);

        const request: Request = new Request({
            url: "url",
            headers: {},
            body: {},
            httpMethod: HttpMethod.Get,
        });

        const route: Route = new Route(null, "method");
        route.context = {};
        route.context.bodyValidator = {};
        route.context.bodyValidator.classType = undefined;

        const methodRouterNode: MethodRouterNode = new MethodRouterNode(new PathRouterNode("/"), HttpMethod.Get, route, 1)

        const returnedRequest = await bodyValidationRequestEnricher.interceptRequest(request, methodRouterNode);

        expect(returnedRequest).toBe(request);
    })

    it("should return the request if there are no errors with the classType", async () => {
        const bodyValidationRequestEnricher = new BodyValidationRequestInterceptor(logHandlerMock);

        const request: Request = new Request({
            url: "url",
            headers: {},
            body: {
                minimumValue: 40,
                maximumValue: 5,
            },
            httpMethod: HttpMethod.Get,
        });

        const route: Route = new Route(null, "method");
        route.context = {};
        route.context.bodyValidator = {};
        route.context.bodyValidator.classType = BodyPayload;

        const methodRouterNode: MethodRouterNode = new MethodRouterNode(new PathRouterNode("/"), HttpMethod.Get, route, 1)

        const returnedRequest = await bodyValidationRequestEnricher.interceptRequest(request, methodRouterNode);

        expect(returnedRequest).toBe(request);
    })

    it("should reject if there are validation errors. ", async () => {
        const bodyValidationRequestEnricher = new BodyValidationRequestInterceptor(logHandlerMock);

        const request: Request = new Request({
            url: "url",
            headers: {},
            body: {
                minimumValue: -2,
                maximumValue:50,
            },
            httpMethod: HttpMethod.Get,
        });

        const route: Route = new Route(null, "method");
        route.context = {};
        route.context.bodyValidator = {};
        route.context.bodyValidator.classType = BodyPayload;

        const methodRouterNode: MethodRouterNode = new MethodRouterNode(new PathRouterNode("/"), HttpMethod.Get, route, 1)

        expect(bodyValidationRequestEnricher.interceptRequest(request, methodRouterNode)).rejects.toThrow();
    })
})
