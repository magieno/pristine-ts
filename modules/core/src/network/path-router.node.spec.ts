import {PathRouterNode} from "./path-router.node";
import {HttpMethod} from "../enums/http-method.enum";
import {MethodRouterNode} from "./method-router.node";
import instance from "tsyringe/dist/typings/dependency-container";

describe("Path Router Node tests", () => {
    let root: PathRouterNode;

    beforeEach(() => {
        root = new PathRouterNode("/", null)

        const api = new PathRouterNode("/api", root);

        // API 1.0
        const apiVersion10 = new PathRouterNode("/1.0", api);
        const dogs = new PathRouterNode("/dogs", apiVersion10);
        const getDogs = new MethodRouterNode(dogs, HttpMethod.Get);
        const postDogs = new MethodRouterNode(dogs, HttpMethod.Post);

        const dog = new PathRouterNode("/{id}", dogs)
        const getDog = new MethodRouterNode(dog, HttpMethod.Get);
        const putDog = new MethodRouterNode(dog, HttpMethod.Put);
        const patchDog = new MethodRouterNode(dog, HttpMethod.Patch);
        const deleteDog = new MethodRouterNode(dog, HttpMethod.Delete);

        const puppies = new PathRouterNode("/puppies", dog);
        const getPuppies = new MethodRouterNode(puppies, HttpMethod.Get);
        const postPuppies = new MethodRouterNode(puppies, HttpMethod.Post);

        const puppy = new PathRouterNode("/{puppyId}", puppies)
        const getPuppy = new MethodRouterNode(puppy, HttpMethod.Get);
        const putPuppy = new MethodRouterNode(puppy, HttpMethod.Put);
        const patchPuppy = new MethodRouterNode(puppy, HttpMethod.Patch);
        const deletePuppy = new MethodRouterNode(puppy, HttpMethod.Delete);

        api.children.push(apiVersion10);
        apiVersion10.children.push(dogs);

        dogs.children.push(getDogs);
        dogs.children.push(postDogs);
        dogs.children.push(dog);

        dog.children.push(getDog);
        dog.children.push(putDog);
        dog.children.push(patchDog);
        dog.children.push(deleteDog);

        dog.children.push(puppies);

        puppies.children.push(getPuppies);
        puppies.children.push(postPuppies);
        puppies.children.push(puppy);

        puppy.children.push(getPuppy);
        puppy.children.push(putPuppy);
        puppy.children.push(patchPuppy);
        puppy.children.push(deletePuppy);

        // API 2.0
        const apiVersion20 = new PathRouterNode("/2.0", api);

        const cats = new PathRouterNode("/cats", apiVersion20);
        const getCats = new MethodRouterNode(cats, HttpMethod.Get);
        const postCats = new MethodRouterNode(cats, HttpMethod.Post);

        const cat = new PathRouterNode("/:id", cats)
        const getCat = new MethodRouterNode(cat, HttpMethod.Get);
        const putCat = new MethodRouterNode(cat, HttpMethod.Put);
        const patchCat = new MethodRouterNode(cat, HttpMethod.Patch);
        const deleteCat = new MethodRouterNode(cat, HttpMethod.Delete);

        const kittens = new PathRouterNode("/kittens", dog);
        const getKittens = new MethodRouterNode(kittens, HttpMethod.Get);
        const postKittens = new MethodRouterNode(kittens, HttpMethod.Post);

        const kitten = new PathRouterNode("/:kittenId", kittens)
        const getKitten = new MethodRouterNode(kitten, HttpMethod.Get);
        const putKitten = new MethodRouterNode(kitten, HttpMethod.Put);
        const patchKitten = new MethodRouterNode(kitten, HttpMethod.Patch);
        const deleteKitten = new MethodRouterNode(kitten, HttpMethod.Delete);

        api.children.push(apiVersion20);
        apiVersion20.children.push(cats);

        cats.children.push(getCats);
        cats.children.push(postCats);
        cats.children.push(cat);

        cat.children.push(getCat);
        cat.children.push(putCat);
        cat.children.push(patchCat);
        cat.children.push(deleteCat);

        cat.children.push(kittens);

        kittens.children.push(getKittens);
        kittens.children.push(postKittens);
        kittens.children.push(kitten);

        kitten.children.push(getKitten);
        kitten.children.push(putKitten);
        kitten.children.push(patchKitten);
        kitten.children.push(deleteKitten);
        
        root.children.push(api);
    })


    it("should match if the path matches", () => {
        const pathRouterNode = new PathRouterNode("/allo", null)
        
        expect(pathRouterNode.matches("/allo")).toBeTruthy()
    })
    
    it("should match if the path doesn't match", () => {
        const pathRouterNode = new PathRouterNode("/allo", null)
        
        expect(pathRouterNode.matches("hello")).toBeFalsy();
    })

    it("should match if the path is a parameter path: '{id}'", () => {
        const pathRouterNode = new PathRouterNode("/{id}", null)

        expect(pathRouterNode.matches("24a12cf7-8bc7-447c-9cb0-d97f5eb23fbb")).toBeTruthy();
    })

    it("should match if the path is a parameter path: ':id'", () => {
        const pathRouterNode = new PathRouterNode("/:id", null)

        expect(pathRouterNode.matches("24a12cf7-8bc7-447c-9cb0-d97f5eb23fbb")).toBeTruthy();
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
        const getKittenRouteParameters = (kittenNode.parent as PathRouterNode).getRouteParameter(kittenSplitPaths.reverse());

        expect(getKittenRouteParameters.id).toBe("137db2ad-e94f-4232-ba13-7910586fa43a")
        expect(getKittenRouteParameters.kittenId).toBe("408ef3cf-f699-4179-a68a-2ea0071dc4fe")

        const puppySplitPaths = ["/", "/api", "/1.0", "/dogs", "/35d7f872-bc3e-4436-8c06-2d027878cefd", "/puppies", "/914db6ac-61b1-41a0-809b-f33758effdee"];
        const puppyNode = root.find(puppySplitPaths, HttpMethod.Get);
        const getPuppyRouteParameters = (puppyNode.parent as PathRouterNode).getRouteParameter(puppySplitPaths.reverse());

        expect(getPuppyRouteParameters.id).toBe("35d7f872-bc3e-4436-8c06-2d027878cefd")
        expect(getPuppyRouteParameters.puppyId).toBe("914db6ac-61b1-41a0-809b-f33758effdee")
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