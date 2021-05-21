import {PathRouterNode} from "./path-router.node";
import {HttpMethod} from "@pristine-ts/common";
import {MethodRouterNode} from "./method-router.node";
import {pathRouterNode} from "../../test-fixtures/path-router.node.test-fixture";
import {Route} from "../models/route";

describe("Path Router Node tests", () => {
    let root: PathRouterNode;

    beforeEach(() => {
        root = pathRouterNode();
    })


    it("should match if the path matches", () => {
        const pathRouterNode = new PathRouterNode("/allo", undefined)

        expect(pathRouterNode.matches("/allo")).toBeTruthy()
    })

    it("should match if the path doesn't match", () => {
        const pathRouterNode = new PathRouterNode("/allo", undefined)

        expect(pathRouterNode.matches("hello")).toBeFalsy();
    })

    it("should match if the path is a parameter path: '{id}'", () => {
        const pathRouterNode = new PathRouterNode("/{id}", undefined)

        expect(pathRouterNode.matches("24a12cf7-8bc7-447c-9cb0-d97f5eb23fbb")).toBeTruthy();
    })

    it("should match if the path is a parameter path: ':id'", () => {
        const pathRouterNode = new PathRouterNode("/:id", undefined)

        expect(pathRouterNode.matches("24a12cf7-8bc7-447c-9cb0-d97f5eb23fbb")).toBeTruthy();
    })

    it("should return null if the split paths passed is less than 1", () => {
        const pathRouterNode = new PathRouterNode("/allo", undefined)

        expect(pathRouterNode.find([], HttpMethod.Get)).toBeNull();
    })

    it("should return null if the split paths[0] doesn't match", () => {
        const pathRouterNode = new PathRouterNode("/allo", undefined)

        expect(pathRouterNode.find(["/hello"], HttpMethod.Get)).toBeNull();
    })

    it("should return the httpMethod router node if it matches", () => {

        expect(root.find(["/", "/api", "/1.0", "/dogs"], HttpMethod.Get) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/1.0", "/dogs"], HttpMethod.Post) instanceof MethodRouterNode).toBeTruthy()

        expect(root.find(["/", "/api", "/1.0", "/dogs", "/e274b7f0-885d-4fd2-8293-e9b21a496703"], HttpMethod.Get) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/1.0", "/dogs", "/137db2ad-e94f-4232-ba13-7910586fa43a"], HttpMethod.Put) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/1.0", "/dogs", "/2528779c-c7c0-493d-bfa9-c8437aede654"], HttpMethod.Patch) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/1.0", "/dogs", "/e41c7631-000e-4f5d-8ab5-ee706ff2034e"], HttpMethod.Delete) instanceof MethodRouterNode).toBeTruthy()

        expect(root.find(["/", "/api", "/1.0", "/dogs", "/cfba36ed-a69d-4569-978d-103fea0e04a5", "/puppies"], HttpMethod.Get) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/1.0", "/dogs", "/6d63cc01-9941-42a2-b97b-e488071cf8a2", "/puppies"], HttpMethod.Post) instanceof MethodRouterNode).toBeTruthy()

        expect(root.find(["/", "/api", "/1.0", "/dogs", "/85d7f853-d86f-421b-ab53-fa859cd78721", "/puppies", "/e453ce4f-959b-45c7-ab94-5cdc351fc581"], HttpMethod.Get) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/1.0", "/dogs", "/d3b72bc7-b884-4d1b-9839-97b7782b356b", "/puppies", "/a652a51d-fd3e-436d-963f-4e69174eece1"], HttpMethod.Put) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/1.0", "/dogs", "/2528779c-c7c0-493d-bfa9-c8437aede654", "/puppies", "/5cac58bf-9768-4b5b-8a5e-9a7c24a05f44"], HttpMethod.Patch) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/1.0", "/dogs", "/e41c7631-000e-4f5d-8ab5-ee706ff2034e", "/puppies", "/70adb9b5-b33b-4bfa-be38-8c30cb52768d"], HttpMethod.Delete) instanceof MethodRouterNode).toBeTruthy()

        expect(root.find(["/", "/api", "/2.0", "/cats"], HttpMethod.Get) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/2.0", "/cats"], HttpMethod.Post) instanceof MethodRouterNode).toBeTruthy()

        expect(root.find(["/", "/api", "/2.0", "/cats", "/e274b7f0-885d-4fd2-8293-e9b21a496703"], HttpMethod.Get) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/2.0", "/cats", "/137db2ad-e94f-4232-ba13-7910586fa43a"], HttpMethod.Put) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/2.0", "/cats", "/2528779c-c7c0-493d-bfa9-c8437aede654"], HttpMethod.Patch) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/2.0", "/cats", "/e41c7631-000e-4f5d-8ab5-ee706ff2034e"], HttpMethod.Delete) instanceof MethodRouterNode).toBeTruthy()

        expect(root.find(["/", "/api", "/2.0", "/cats", "/e274b7f0-885d-4fd2-8293-e9b21a496703", "/kittens"], HttpMethod.Get) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/2.0", "/cats", "/e274b7f0-885d-4fd2-8293-e9b21a496703", "/kittens"], HttpMethod.Post) instanceof MethodRouterNode).toBeTruthy()

        expect(root.find(["/", "/api", "/2.0", "/cats", "/137db2ad-e94f-4232-ba13-7910586fa43a", "/kittens", "/408ef3cf-f699-4179-a68a-2ea0071dc4fe"], HttpMethod.Get) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/2.0", "/cats", "/137db2ad-e94f-4232-ba13-7910586fa43a", "/kittens", "/408ef3cf-f699-4179-a68a-2ea0071dc4fe"], HttpMethod.Put) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/2.0", "/cats", "/2528779c-c7c0-493d-bfa9-c8437aede654", "/kittens", "/5cac58bf-9768-4b5b-8a5e-9a7c24a05f44"], HttpMethod.Patch) instanceof MethodRouterNode).toBeTruthy()
        expect(root.find(["/", "/api", "/2.0", "/cats", "/e41c7631-000e-4f5d-8ab5-ee706ff2034e", "/kittens", "/70adb9b5-b33b-4bfa-be38-8c30cb52768d"], HttpMethod.Delete) instanceof MethodRouterNode).toBeTruthy()


    })


    it("should retrieve the route parameters with the proper names and values", () => {
        const kittenSplitPaths = ["/", "/api", "/2.0", "/cats", "/137db2ad-e94f-4232-ba13-7910586fa43a", "/kittens", "/408ef3cf-f699-4179-a68a-2ea0071dc4fe"];
        const kittenNode = root.find(kittenSplitPaths, HttpMethod.Put);
        const getKittenRouteParameters = (kittenNode!.parent as PathRouterNode).getRouteParameters(kittenSplitPaths.reverse());

        expect(getKittenRouteParameters.id).toBe("137db2ad-e94f-4232-ba13-7910586fa43a")
        expect(getKittenRouteParameters.kittenId).toBe("408ef3cf-f699-4179-a68a-2ea0071dc4fe")

        const puppySplitPaths = ["/", "/api", "/1.0", "/dogs", "/35d7f872-bc3e-4436-8c06-2d027878cefd", "/puppies", "/914db6ac-61b1-41a0-809b-f33758effdee"];
        const puppyNode = root.find(puppySplitPaths, HttpMethod.Get);
        const getPuppyRouteParameters = (puppyNode!.parent as PathRouterNode).getRouteParameters(puppySplitPaths.reverse());

        expect(getPuppyRouteParameters.id).toBe("35d7f872-bc3e-4436-8c06-2d027878cefd")
        expect(getPuppyRouteParameters.puppyId).toBe("914db6ac-61b1-41a0-809b-f33758effdee")
    })

    it("should properly add and build the trees", () => {
        const root = new PathRouterNode("/", undefined);

        root.add(["/", "/level1"], HttpMethod.Get, new Route("controller", "key"));
        root.add(["/", "/level1", "/a"], HttpMethod.Patch, new Route("controller", "key"));
        root.add(["/", "/level1", "/b"], HttpMethod.Put, new Route("controller", "key"));

        root.add(["/", "/level2"], HttpMethod.Get, new Route("controller", "key"));
        root.add(["/", "/level2", "/a"], HttpMethod.Post, new Route("controller", "key"));
        root.add(["/", "/level2", "/b"], HttpMethod.Delete, new Route("controller", "key"));

        expect(root.find(["/", "/level1"], HttpMethod.Get)).toBeDefined()

        expect(root.find(["/", "/level1", "/a"], HttpMethod.Patch)).toBeDefined()

        expect(root.find(["/", "/level1", "/a"], HttpMethod.Put)).toBeDefined()
        expect(root.find(["/", "/level1", "/a"], HttpMethod.Delete)).toBeNull()

        expect(root.find(["/", "/level2", "/a"], HttpMethod.Post)).toBeDefined()

        expect(root.find(["/", "/level2", "/a"], HttpMethod.Delete)).toBeDefined()
    })
})
