import "reflect-metadata";
import {PathRouterNode} from "./path-router.node";
import {pathRouterNode} from "../test-fixtures/path-router.node.test-fixture.spec";
import {HttpMethod} from "../enums/http-method.enum";
import {RouteInformation} from "./route-information";
import {RouteParameterDecoratorInterface} from "../interfaces/route-parameter-decorator.interface";
import {QueryParameterDecoratorInterface} from "../interfaces/query-parameter.decorator";
import {QueryParametersDecoratorInterface} from "../interfaces/query-parameters-decorator.interface";
import {BodyParameterDecoratorInterface} from "../interfaces/body-parameteter-decorator.interface";
import {Router} from "./router";
import {Request} from "./request";
import {MethodRouterNode} from "./method-router.node";

describe("Router.spec", () => {
    let root: PathRouterNode;

    let mockController;

    let router: Router;

    let mockContainer;

    let request: Request;

    let spyMethodController;

    beforeAll(() => {
        root = pathRouterNode();
        const dog20PutMethodNode: MethodRouterNode<RouteInformation> = root.find(["/", "/api", "/1.0", "/dogs", "/caniche-royal"], HttpMethod.Put) as MethodRouterNode<RouteInformation>;

        expect(dog20PutMethodNode).toBeDefined();

        mockController = {
            route: (parameterName: string, queryParameter: string, sortParameter: string, queryParameters: object, body: object) => {
                const a = 0;
            }
        };

        const routeInformation = new RouteInformation("mockController", "route");

        const routeIdParameter: RouteParameterDecoratorInterface = {
            type: "routeParam",
            routeParameterName: "id"
        }

        const queryParameter: QueryParameterDecoratorInterface = {
            type: "queryParam",
            queryParameterName: "query",
        }

        const sortQueryParameter: QueryParameterDecoratorInterface = {
            type: "queryParam",
            queryParameterName: "sort",
        }

        const queryParameters: QueryParametersDecoratorInterface = {
            type: "queryParams",
        }

        const bodyParameter: BodyParameterDecoratorInterface = {
            type: "body",
        }

        routeInformation.methodArguments = [
            routeIdParameter,
            queryParameter,
            sortQueryParameter,
            queryParameters,
            bodyParameter,
        ];

        // @ts-ignore
        dog20PutMethodNode["data"] = routeInformation;

        spyMethodController = jest.spyOn(mockController, "route");

        // Force the node as the root node
        router = new Router();
        router["root"] = root;

        // Create the MockContainer
        mockContainer = {
            resolve: (token: any)  => {
                return mockController;
            }
        }
    })

    beforeEach(() => {
        request = {
            httpMethod: HttpMethod.Put,
            body: {
                name: "name",
            },
            url: "",
        }
    })

    it("PUT - https://ima-tech.ca/api/1.0/dogs/caniche-royal", () => {
        request.url = "https://ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", () => {
        request.url = "https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", () => {
        request.url = "https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", () => {
        request.url = "https://ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", () => {
        request.url = "https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", () => {
        request.url = "https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://ima-tech.ca/api/1.0/dogs/caniche-royal", () => {
        request.url = "http://ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", () => {
        request.url = "http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", () => {
        request.url = "http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", () => {
        request.url = "http://ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", () => {
        request.url = "http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", () => {
        request.url = "http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://www.ima-tech.ca/api/1.0/dogs/caniche-royal", () => {
        request.url = "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", () => {
        request.url = "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", () => {
        request.url = "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://www.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", () => {
        request.url = "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", () => {
        request.url = "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", () => {
        request.url = "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://www.ima-tech.ca/api/1.0/dogs/caniche-royal", () => {
        request.url = "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", () => {
        request.url = "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", () => {
        request.url = "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://www.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", () => {
        request.url = "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", () => {
        request.url = "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", () => {
        request.url = "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal", () => {
        request.url = "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", () => {
        request.url = "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", () => {
        request.url = "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", () => {
        request.url = "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", () => {
        request.url = "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", () => {
        request.url = "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal", () => {
        request.url = "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", () => {
        request.url = "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", () => {
        request.url = "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", () => {
        request.url = "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", () => {
        request.url = "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", () => {
        request.url = "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal", () => {
        request.url = "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", () => {
        request.url = "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", () => {
        request.url = "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", () => {
        request.url = "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", () => {
        request.url = "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", () => {
        request.url = "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal", () => {
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", () => {
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", () => {
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", () => {
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", () => {
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", () => {
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

});