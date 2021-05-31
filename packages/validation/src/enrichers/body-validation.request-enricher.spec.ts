import "reflect-metadata"
import {BodyValidationRequestEnricher} from "./body-validation.request-enricher";
import {MethodRouterNode, PathRouterNode, Request, Route} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";
import {IsDate, IsInt, Max, Min} from "class-validator";

describe("Body Validation Request Enricher", () => {
    class BodyPayload {
        @IsInt()
        @Min(0)
        minimumValue: number;

        @IsInt()
        @Max(10)
        maximumValue: number;
    }

    it("should simply return the request if the bodyValidator is undefined", async () => {
        const bodyValidationRequestEnricher = new BodyValidationRequestEnricher();

        const request: Request = new Request({
            url: "url",
            headers: {},
            body: {},
            httpMethod: HttpMethod.Get,
        });

        const route: Route = new Route(null, "method");
        route.context = {}
        route.context.bodyValidator = undefined;

        const methodRouterNode: MethodRouterNode = new MethodRouterNode(new PathRouterNode("/"), HttpMethod.Get, route)

        const returnedRequest = await bodyValidationRequestEnricher.enrichRequest(request, methodRouterNode);

        expect(returnedRequest).toBe(request);
    })

    it("should simply return the request if the classType is undefined", async () => {
        const bodyValidationRequestEnricher = new BodyValidationRequestEnricher();

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

        const methodRouterNode: MethodRouterNode = new MethodRouterNode(new PathRouterNode("/"), HttpMethod.Get, route)

        const returnedRequest = await bodyValidationRequestEnricher.enrichRequest(request, methodRouterNode);

        expect(returnedRequest).toBe(request);
    })

    it("should return the request if there are no errors with the classType", async () => {
        const bodyValidationRequestEnricher = new BodyValidationRequestEnricher();

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

        const methodRouterNode: MethodRouterNode = new MethodRouterNode(new PathRouterNode("/"), HttpMethod.Get, route)

        const returnedRequest = await bodyValidationRequestEnricher.enrichRequest(request, methodRouterNode);

        expect(returnedRequest).toBe(request);
    })

    it("should reject if there are validation errors. ", async () => {
        const bodyValidationRequestEnricher = new BodyValidationRequestEnricher();

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

        const methodRouterNode: MethodRouterNode = new MethodRouterNode(new PathRouterNode("/"), HttpMethod.Get, route)

        expect(bodyValidationRequestEnricher.enrichRequest(request, methodRouterNode)).rejects.toThrow();
    })
})
