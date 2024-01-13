import "reflect-metadata"
import {BodyValidationRequestInterceptor} from "./body-validation.request-interceptor";
import {MethodRouterNode, PathRouterNode, Route} from "@pristine-ts/networking";
import {HttpMethod, Request} from "@pristine-ts/common";
import {IsDate, IsInt, Max, Min, Validator} from "@pristine-ts/class-validator";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {bodyValidationMetadataKeyname} from "../decorators/body-validation.decorator";

describe("Body Validation Request Enricher", () => {
    const logHandlerMock: LogHandlerInterface = {
        critical(message: string, extra?: any): void {
        }, debug(message: string, extra?: any): void {
        }, error(message: string, extra?: any): void {
        }, info(message: string, extra?: any): void {
        }, warning(message: string, extra?: any): void {
        }, terminate() {
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
        const bodyValidationRequestInterceptor = new BodyValidationRequestInterceptor(logHandlerMock, new Validator());

        const request: Request = new Request(HttpMethod.Get, "url");

        const route: Route = new Route(null, "method");
        route.context = {}
        route.context[bodyValidationMetadataKeyname] = undefined;

        const methodRouterNode: MethodRouterNode = new MethodRouterNode(new PathRouterNode("/"), HttpMethod.Get, route, 1)

        const returnedRequest = await bodyValidationRequestInterceptor.interceptRequest(request, methodRouterNode);

        expect(returnedRequest).toBe(request);
    })

    it("should simply return the request if the classType is undefined", async () => {
        const bodyValidationRequestEnricher = new BodyValidationRequestInterceptor(logHandlerMock, new Validator());

        const request: Request = new Request(HttpMethod.Get, "url");

        const route: Route = new Route(null, "method");
        route.context = {};
        route.context[bodyValidationMetadataKeyname] = {};
        route.context[bodyValidationMetadataKeyname].classType = undefined;

        const methodRouterNode: MethodRouterNode = new MethodRouterNode(new PathRouterNode("/"), HttpMethod.Get, route, 1)

        const returnedRequest = await bodyValidationRequestEnricher.interceptRequest(request, methodRouterNode);

        expect(returnedRequest).toBe(request);
    })

    it("should return the request if there are no errors with the classType", async () => {
        const bodyValidationRequestEnricher = new BodyValidationRequestInterceptor(logHandlerMock, new Validator());

        const request: Request = new Request(HttpMethod.Get, "url");

        request.body = {
            minimumValue: 40,
            maximumValue: 5,
        };

        const route: Route = new Route(null, "method");
        route.context = {};
        route.context[bodyValidationMetadataKeyname] = {};
        route.context[bodyValidationMetadataKeyname].classType = BodyPayload;

        const methodRouterNode: MethodRouterNode = new MethodRouterNode(new PathRouterNode("/"), HttpMethod.Get, route, 1)

        const returnedRequest = await bodyValidationRequestEnricher.interceptRequest(request, methodRouterNode);

        expect(returnedRequest).toBe(request);
    })

    it("should reject if there are validation errors. ", async () => {
        const bodyValidationRequestEnricher = new BodyValidationRequestInterceptor(logHandlerMock, new Validator());

        const request: Request = new Request(HttpMethod.Get, "url");
        request.body = {
            minimumValue: -2,
            maximumValue:50,
        };

        const route: Route = new Route(null, "method");
        route.context = {};
        route.context[bodyValidationMetadataKeyname] = {};
        route.context[bodyValidationMetadataKeyname].classType = BodyPayload;

        const methodRouterNode: MethodRouterNode = new MethodRouterNode(new PathRouterNode("/"), HttpMethod.Get, route, 1)

        expect(bodyValidationRequestEnricher.interceptRequest(request, methodRouterNode)).rejects.toThrow();
    })
})
