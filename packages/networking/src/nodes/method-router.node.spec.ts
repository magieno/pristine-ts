import {MethodRouterNode} from "./method-router.node";
import {PathRouterNode} from "./path-router.node";
import {HttpMethod} from "@pristine-ts/common";
import {Route} from "../models/route";

describe("Path Router Node tests", () => {
    it("should instantiate with the appropriate parent and httpMethod", () => {
        const pathRouterNode = new PathRouterNode("/allo", undefined)

        const methodRouterNode = new MethodRouterNode(pathRouterNode, HttpMethod.Get, new Route("controller", "key"), 1);

        expect(methodRouterNode.parent).toBeDefined();
        expect(methodRouterNode.parent).toBe(pathRouterNode);

        expect(methodRouterNode.children.length).toBe(0);
        expect(methodRouterNode.method).toBe(HttpMethod.Get);
    })

    it("should matches when it's defined with a certain http httpMethod", () => {
        const pathRouterNode = new PathRouterNode("/allo", undefined)

        const methodRouterNode = new MethodRouterNode(pathRouterNode, HttpMethod.Get, new Route("controller", "key"), 1);

        expect(methodRouterNode.matches(HttpMethod.Get)).toBeTruthy();
    })

    it("should not match when it's defined with a certain http httpMethod and passed with another", () => {
        const pathRouterNode = new PathRouterNode("/allo", undefined)

        const methodRouterNode = new MethodRouterNode(pathRouterNode, HttpMethod.Get, new Route("controller", "key"), 1);

        expect(methodRouterNode.matches(HttpMethod.Post)).toBeFalsy();
    })

    it("should return the node when calling find if the httpMethod matches", () => {
        const pathRouterNode = new PathRouterNode("/allo", undefined)

        const methodRouterNode = new MethodRouterNode(pathRouterNode, HttpMethod.Get, new Route("controller", "key"), 1);

        expect(methodRouterNode.find([], HttpMethod.Get)).toBeDefined();
        expect(methodRouterNode.find([], HttpMethod.Get)).toBe(methodRouterNode);
    })

    it("should return nul when calling find if the httpMethod doesn't match", () => {
        const pathRouterNode = new PathRouterNode("/allo", undefined)

        const methodRouterNode = new MethodRouterNode(pathRouterNode, HttpMethod.Get, new Route("controller", "key"), 1);

        expect(methodRouterNode.find([], HttpMethod.Post)).toBeNull();
    })
})
