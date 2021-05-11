import "reflect-metadata";
import {pathRouterNode} from "../test-fixtures/path-router.node.test-fixture";
import {RouteParameterDecoratorInterface} from "./interfaces/route-parameter-decorator.interface";
import {QueryParameterDecoratorInterface} from "./interfaces/query-parameter-decorator.interface";
import {QueryParametersDecoratorInterface} from "./interfaces/query-parameters-decorator.interface";
import {PathRouterNode} from "./nodes/path-router.node";
import {MethodRouterNode} from "./nodes/method-router.node";
import {Router} from "./router";
import {Request} from "./models/request";
import {Route} from "./models/route";
import {ControllerMethodParameterDecoratorResolver} from "./resolvers/controller-method-parameter-decorator.resolver";
import {BodyParameterDecoratorResolver} from "./resolvers/body-parameter-decorator.resolver";
import {QueryParameterDecoratorResolver} from "./resolvers/query-parameter-decorator.resolver";
import {QueryParametersDecoratorResolver} from "./resolvers/query-parameters-decorator.resolver";
import {RouteParameterDecoratorResolver} from "./resolvers/route-parameter-decorator.resolver";
import {BodyParameterDecoratorInterface} from "./interfaces/body-parameter-decorator.interface";
import {HttpMethod, IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {DependencyContainer, container} from "tsyringe";


describe("Router.spec", () => {
    let root: PathRouterNode;

    let mockController;

    let router: Router;

    let mockContainer: DependencyContainer;

    let request: Request;

    let spyMethodController;

    beforeAll(() => {
        root = pathRouterNode();
        const dog20PutMethodNode: MethodRouterNode = root.find(["/", "/api", "/1.0", "/dogs", "/caniche-royal"], HttpMethod.Put) as MethodRouterNode;

        expect(dog20PutMethodNode).toBeDefined();

        mockController = {
            route: (parameterName: string, queryParameter: string, sortParameter: string, queryParameters: object, body: object) => {
                const a = 0;
            }
        };

        const route = new Route("mockController", "route");

        const routeIdParameter: RouteParameterDecoratorInterface = {
            type: "routeParameter",
            routeParameterName: "id"
        }

        const queryParameter: QueryParameterDecoratorInterface = {
            type: "queryParameter",
            queryParameterName: "query",
        }

        const sortQueryParameter: QueryParameterDecoratorInterface = {
            type: "queryParameter",
            queryParameterName: "sort",
        }

        const queryParameters: QueryParametersDecoratorInterface = {
            type: "queryParameters",
        }

        const bodyParameter: BodyParameterDecoratorInterface = {
            type: "body",
        }

        route.methodArguments = [
            routeIdParameter,
            queryParameter,
            sortQueryParameter,
            queryParameters,
            bodyParameter,
        ];

        // @ts-ignore
        dog20PutMethodNode["route"] = route;

        spyMethodController = jest.spyOn(mockController, "route");

        // Force the node as the root node
        router = new Router(new ControllerMethodParameterDecoratorResolver([
            new BodyParameterDecoratorResolver(),
            new QueryParameterDecoratorResolver(),
            new QueryParametersDecoratorResolver(),
            new RouteParameterDecoratorResolver(),
        ]), {
            isAuthorized(requestInterface: RequestInterface, routeContext: any, container, identity?: IdentityInterface): Promise<boolean> {
                return Promise.resolve(true);
            }
        }, {
            authenticate(request: RequestInterface, routeContext: any, container): Promise<IdentityInterface | undefined> {
                return Promise.resolve(undefined);
            }
        });

        router["root"] = root;

        // Create the MockContainer
        mockContainer = container.createChildContainer();
        mockContainer.resolve = (token: any)  => {
            return mockController;
        }
    })

    beforeEach(() => {
        request = new Request({
            httpMethod: HttpMethod.Put,
            body: {
                name: "name",
            },
            url: "",
        });
    })

    it("PUT - https://ima-tech.ca/api/1.0/dogs/caniche-royal", async () => {
        request.url = "https://ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", async () => {
        request.url = "https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", async () => {
        request.url = "https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", async () => {
        request.url = "https://ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", async () => {
        request.url = "https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", async () => {
        request.url = "https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://ima-tech.ca/api/1.0/dogs/caniche-royal", async () => {
        request.url = "http://ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", async () => {
        request.url = "http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", async () => {
        request.url = "http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", async () => {
        request.url = "http://ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", async () => {
        request.url = "http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", async () => {
        request.url = "http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://www.ima-tech.ca/api/1.0/dogs/caniche-royal", async () => {
        request.url = "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", async () => {
        request.url = "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", async () => {
        request.url = "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://www.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", async () => {
        request.url = "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", async () => {
        request.url = "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", async () => {
        request.url = "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://www.ima-tech.ca/api/1.0/dogs/caniche-royal", async () => {
        request.url = "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", async () => {
        request.url = "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", async () => {
        request.url = "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://www.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", async () => {
        request.url = "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", async () => {
        request.url = "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", async () => {
        request.url = "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal", async () => {
        request.url = "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", async () => {
        request.url = "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", async () => {
        request.url = "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", async () => {
        request.url = "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", async () => {
        request.url = "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", async () => {
        request.url = "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal", async () => {
        request.url = "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", async () => {
        request.url = "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", async () => {
        request.url = "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", async () => {
        request.url = "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", async () => {
        request.url = "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", async () => {
        request.url = "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal", async () => {
        request.url = "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", async () => {
        request.url = "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", async () => {
        request.url = "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", async () => {
        request.url = "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", async () => {
        request.url = "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", async () => {
        request.url = "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal", async () => {
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm", async () => {
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC", async () => {
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })

    it("PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink", async () => {
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", null, null, {}, request.body);
    })

    it("PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink", async () => {
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body);
    })

    it("PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", async () => {
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        const response = await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenCalledWith("caniche-royal", "searchTerm", "ASC", {"query": "searchTerm", "sort": "ASC"}, request.body);
    })
});
