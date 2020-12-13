import {PathRouterNode} from "./path-router.node";
import {HttpMethod} from "../enums/http-method.enum";
import {MethodRouterNode} from "./method-router.node";

describe("Path Router Node tests", () => {
    it("should match if the path matches", () => {
        const pathRouterNode = new PathRouterNode("/allo", null)
        
        expect(pathRouterNode.matches("/allo")).toBeTruthy()
    })
    
    it("should match if the path doesn't match", () => {
        const pathRouterNode = new PathRouterNode("/allo", null)
        
        expect(pathRouterNode.matches("hello")).toBeFalsy();
    })
    
    it("should return null if the split paths passed is less than 1", () => {
        const pathRouterNode = new PathRouterNode("/allo", null)

        expect(pathRouterNode.find([], HttpMethod.Get)).toBeNull();
    })
    
    it("should return null if the split paths[0] doesn't match", () => {
        const pathRouterNode = new PathRouterNode("/allo", null)

        expect(pathRouterNode.find(["/hello"], HttpMethod.Get)).toBeNull();
    })
    
    it("should return the method router node if it matches", () => {
        const root = new PathRouterNode("/", null)

        // Level 1
        const level1 = new PathRouterNode("/level1", root);
        const level1a = new PathRouterNode("/a", level1);
        const level1b = new PathRouterNode("/b", level1);
        level1.children.push(level1a);
        level1.children.push(level1b);
        root.children.push(level1);
        
        const level1Get = new MethodRouterNode(level1, HttpMethod.Get);
        level1.children.push(level1Get);

        const level1aPatch = new MethodRouterNode(level1, HttpMethod.Patch);
        const level1aPut = new MethodRouterNode(level1, HttpMethod.Put);
        level1a.children.push(level1aPatch);
        level1a.children.push(level1aPut);
        
        // Level 2
        const level2 = new PathRouterNode("/level2", root);
        const level2a = new PathRouterNode("/a", level2);
        const level2b = new PathRouterNode("/b", level2);
        level2.children.push(level2a);
        level2.children.push(level2b);
        root.children.push(level2);

        const level2Get = new MethodRouterNode(level2, HttpMethod.Get);
        level2.children.push(level2Get);

        const level2aPost = new MethodRouterNode(level2, HttpMethod.Post);
        const level2aDelete = new MethodRouterNode(level2, HttpMethod.Delete);
        level2a.children.push(level2aPost);
        level2a.children.push(level2aDelete);

        expect(root.find(["/", "/level1"], HttpMethod.Get)).toBeDefined()
        expect(root.find(["/", "/level1"], HttpMethod.Get)).toBe(level1Get)

        expect(root.find(["/", "/level1", "/a"], HttpMethod.Patch)).toBeDefined()
        expect(root.find(["/", "/level1", "/a"], HttpMethod.Patch)).toBe(level1aPatch)

        expect(root.find(["/", "/level1", "/a"], HttpMethod.Put)).toBeDefined()
        expect(root.find(["/", "/level1", "/a"], HttpMethod.Put)).toBe(level1aPut)
        expect(root.find(["/", "/level1", "/a"], HttpMethod.Delete)).toBeNull()

        expect(root.find(["/", "/level2", "/a"], HttpMethod.Post)).toBeDefined()
        expect(root.find(["/", "/level2", "/a"], HttpMethod.Post)).toBe(level2aPost)

        expect(root.find(["/", "/level2", "/a"], HttpMethod.Delete)).toBeDefined()
        expect(root.find(["/", "/level2", "/a"], HttpMethod.Delete)).toBe(level2aDelete)


        expect(root.find(["/", "/level1", "/c"], HttpMethod.Delete)).toBeNull()
        expect(root.find(["/", "/c"], HttpMethod.Delete)).toBeNull()
    })

    it("should properly add and build the trees", () => {
        const root = new PathRouterNode("/", null);

        root.add(["/", "/level1"], HttpMethod.Get);
        root.add(["/", "/level1", "/a"], HttpMethod.Patch);
        root.add(["/", "/level1", "/b"], HttpMethod.Put);

        root.add(["/", "/level2"], HttpMethod.Get);
        root.add(["/", "/level2", "/a"], HttpMethod.Post);
        root.add(["/", "/level2", "/b"], HttpMethod.Delete);

        expect(root.find(["/", "/level1"], HttpMethod.Get)).toBeDefined()

        expect(root.find(["/", "/level1", "/a"], HttpMethod.Patch)).toBeDefined()

        expect(root.find(["/", "/level1", "/a"], HttpMethod.Put)).toBeDefined()
        expect(root.find(["/", "/level1", "/a"], HttpMethod.Delete)).toBeNull()

        expect(root.find(["/", "/level2", "/a"], HttpMethod.Post)).toBeDefined()

        expect(root.find(["/", "/level2", "/a"], HttpMethod.Delete)).toBeDefined()
    })
})