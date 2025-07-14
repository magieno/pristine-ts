import "reflect-metadata";
import {pathRouterNode} from "../test-fixtures/path-router.node.test-fixture";
import {RouteParameterDecoratorInterface} from "./interfaces/route-parameter-decorator.interface";
import {QueryParameterDecoratorInterface} from "./interfaces/query-parameter-decorator.interface";
import {QueryParametersDecoratorInterface} from "./interfaces/query-parameters-decorator.interface";
import {PathRouterNode} from "./nodes/path-router.node";
import {MethodRouterNode} from "./nodes/method-router.node";
import {Router} from "./router";
import {Route} from "./models/route";
import {ControllerMethodParameterDecoratorResolver} from "./resolvers/controller-method-parameter-decorator.resolver";
import {BodyParameterDecoratorResolver} from "./resolvers/body-parameter-decorator.resolver";
import {QueryParameterDecoratorResolver} from "./resolvers/query-parameter-decorator.resolver";
import {QueryParametersDecoratorResolver} from "./resolvers/query-parameters-decorator.resolver";
import {RouteParameterDecoratorResolver} from "./resolvers/route-parameter-decorator.resolver";
import {BodyParameterDecoratorInterface} from "./interfaces/body-parameter-decorator.interface";
import {HttpMethod, IdentityInterface, Request} from "@pristine-ts/common";
import {Span, TracingManagerInterface} from "@pristine-ts/telemetry";
import {DependencyContainer, container} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {RouterCache} from "./cache/router.cache";
import {RouterInterface} from "./interfaces/router.interface";

describe("Router.spec", () => {
    let root: PathRouterNode;

    let mockController: any;

    let mockContainer: DependencyContainer;

    let mockTracingManager: TracingManagerInterface = {
        addSpan(span: Span): Span {
            return span;
        }, endSpan(span: Span): any {
        }, endTrace(): any {
        }, endSpanKeyname(keyname: string): any {
        }, startSpan(keyname: string, parentKeyname?: string, parentId?: string, context?: { [p: string]: string }): Span {
            return new Span("root");
        }, startTracing(spanRootKeyname?: string, traceId?: string, context?: { [p: string]: string }): Span {
            return new Span("root");
        }

    };

    let spyMethodController: any;

    beforeAll(() => {
        root = pathRouterNode();
        const dog20PutMethodNode: MethodRouterNode = root.find(["/", "/api", "/1.0", "/dogs", "/caniche-royal"], HttpMethod.Put) as MethodRouterNode;

        expect(dog20PutMethodNode).toBeDefined();

        mockController = {
            route: (parameterName: string, queryParameter: string, sortParameter: string, queryParameters: object, body: object) => {
                const a = 0;
            }
        };

        mockTracingManager = {
            addSpan(span: Span): Span {
                return span;
            }, endSpan(span: Span): any {
            }, endTrace(): any {
            }, endSpanKeyname(keyname: string): any {
            }, startSpan(keyname: string, parentKeyname?: string, parentId?: string, context?: { [p: string]: string }): Span {
                return new Span("root");
            }, startTracing(spanRootKeyname?: string, traceId?: string, context?: { [p: string]: string }): Span {
                return new Span("root");
            }

        };

        container.register("TracingManagerInterface", {
            useValue: mockTracingManager,
        });

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
    });

    const loghandlerMock: LogHandlerInterface = {
        critical(message: string, extra?: any, module?: string): void {
        }, debug(message: string, extra?: any, module?: string): void {
        }, error(message: string, extra?: any, module?: string): void {
        }, info(message: string, extra?: any, module?: string): void {
        }, terminate(): void {
        }, warning(message: string, extra?: any, module?: string): void {
        }

    };

    // Force the node as the root node
    const getRouter = (activateCache: boolean) => {
        // Create the MockContainer
        mockContainer = container.createChildContainer();
        mockContainer.resolve = (token: any) => {
            if (token === "TracingManagerInterface") {
                return mockTracingManager;
            }

            return mockController;
        }

        const router = new Router({
            critical(message: string, extra?: any): void {
            }, debug(message: string, extra?: any): void {
            }, error(message: string, extra?: any): void {
            }, info(message: string, extra?: any): void {
            }, warning(message: string, extra?: any): void {
            }, terminate() {
            }
        }, new ControllerMethodParameterDecoratorResolver([
            new BodyParameterDecoratorResolver(),
            new QueryParameterDecoratorResolver(loghandlerMock),
            new QueryParametersDecoratorResolver(loghandlerMock),
            new RouteParameterDecoratorResolver(),
        ]), {
            isAuthorized(requestInterface: Request, routeContext: any, container, identity?: IdentityInterface): Promise<boolean> {
                return Promise.resolve(true);
            }
        }, {
            authenticate(request: Request, routeContext: any, container): Promise<IdentityInterface | undefined> {
                return Promise.resolve(undefined);
            }
        }, new RouterCache(activateCache));

        router["root"] = root;

        return router;
    }


    it("should call the correct methods for the routers", async () => {
        const request = new Request(HttpMethod.Put, "", "uuid");
        request.body = {name: "name"};

        const requestUrls: { url: string, expectedArguments: any[] }[] = [
            {
                url: "https://ima-tech.ca/api/1.0/dogs/caniche-royal",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "https://ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "https://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "http://ima-tech.ca/api/1.0/dogs/caniche-royal",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "http://ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "http://ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "https://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "http://www.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "https://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "http://subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "https://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
            {
                url: "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal#anchorLink",
                expectedArguments: ["caniche-royal", null, null, null, request.body],
            },
            {
                url: "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm",
                expectedArguments: ["caniche-royal", "searchTerm", null, {"query": "searchTerm"}, request.body],
            },
            {
                url: "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink",
                expectedArguments: ["caniche-royal", "searchTerm", "ASC", {
                    "query": "searchTerm",
                    "sort": "ASC"
                }, request.body],
            },
        ];

        for (let router of [getRouter(false), getRouter(true)]) {
            for (const requestUrl of requestUrls) {
                request.url = requestUrl.url;

                await router.execute(request, mockContainer);

                expect(spyMethodController).toHaveBeenLastCalledWith(...requestUrl.expectedArguments);
            }
        }
    });


    it("Call twice (with caching) - PUT - http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink", async () => {
        const router = getRouter(true)
        const request = new Request(HttpMethod.Put, "", "uuid");
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";

        await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenLastCalledWith("caniche-royal", "searchTerm", "ASC", {
            "query": "searchTerm",
            "sort": "ASC"
        }, request.body);

        // Tweak the request to ensure that the caching properly works
        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";
        await router.execute(request, mockContainer);

        request.url = "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink";
        await router.execute(request, mockContainer);

        expect(spyMethodController).toHaveBeenLastCalledWith("caniche-royal", "searchTerm", "ASC", {
            "query": "searchTerm",
            "sort": "ASC"
        }, request.body);
    })


});
