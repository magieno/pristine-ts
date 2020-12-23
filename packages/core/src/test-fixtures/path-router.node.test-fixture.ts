import {HttpMethod} from "../enums/http-method.enum";
import {PathRouterNode} from "../nodes/path-router.node";
import {MethodRouterNode} from "../nodes/method-router.node";
import {Route} from "../models/route";

export const pathRouterNode = (): PathRouterNode => {

    const root = new PathRouterNode("/", undefined)

    const api = new PathRouterNode("/api", root);

// API 1.0
    const apiVersion10 = new PathRouterNode("/1.0", api);
    const dogs = new PathRouterNode("/dogs", apiVersion10);
    const getDogs = new MethodRouterNode(dogs, HttpMethod.Get, new Route("controller", "key"));
    const postDogs = new MethodRouterNode(dogs, HttpMethod.Post, new Route("controller", "key"));

    const dog = new PathRouterNode("/{id}", dogs)
    const getDog = new MethodRouterNode(dog, HttpMethod.Get, new Route("controller", "key"));
    const putDog = new MethodRouterNode(dog, HttpMethod.Put, new Route("controller", "key"));
    const patchDog = new MethodRouterNode(dog, HttpMethod.Patch, new Route("controller", "key"));
    const deleteDog = new MethodRouterNode(dog, HttpMethod.Delete, new Route("controller", "key"));

    const puppies = new PathRouterNode("/puppies", dog);
    const getPuppies = new MethodRouterNode(puppies, HttpMethod.Get, new Route("controller", "key"));
    const postPuppies = new MethodRouterNode(puppies, HttpMethod.Post, new Route("controller", "key"));

    const puppy = new PathRouterNode("/{puppyId}", puppies)
    const getPuppy = new MethodRouterNode(puppy, HttpMethod.Get, new Route("controller", "key"));
    const putPuppy = new MethodRouterNode(puppy, HttpMethod.Put, new Route("controller", "key"));
    const patchPuppy = new MethodRouterNode(puppy, HttpMethod.Patch, new Route("controller", "key"));
    const deletePuppy = new MethodRouterNode(puppy, HttpMethod.Delete, new Route("controller", "key"));

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
    const getCats = new MethodRouterNode(cats, HttpMethod.Get, new Route("controller", "key"));
    const postCats = new MethodRouterNode(cats, HttpMethod.Post, new Route("controller", "key"));

    const cat = new PathRouterNode("/:id", cats)
    const getCat = new MethodRouterNode(cat, HttpMethod.Get, new Route("controller", "key"));
    const putCat = new MethodRouterNode(cat, HttpMethod.Put, new Route("controller", "key"));
    const patchCat = new MethodRouterNode(cat, HttpMethod.Patch, new Route("controller", "key"));
    const deleteCat = new MethodRouterNode(cat, HttpMethod.Delete, new Route("controller", "key"));

    const kittens = new PathRouterNode("/kittens", dog);
    const getKittens = new MethodRouterNode(kittens, HttpMethod.Get, new Route("controller", "key"));
    const postKittens = new MethodRouterNode(kittens, HttpMethod.Post, new Route("controller", "key"));

    const kitten = new PathRouterNode("/:kittenId", kittens)
    const getKitten = new MethodRouterNode(kitten, HttpMethod.Get, new Route("controller", "key"));
    const putKitten = new MethodRouterNode(kitten, HttpMethod.Put, new Route("controller", "key"));
    const patchKitten = new MethodRouterNode(kitten, HttpMethod.Patch, new Route("controller", "key"));
    const deleteKitten = new MethodRouterNode(kitten, HttpMethod.Delete, new Route("controller", "key"));

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

    return root;
};