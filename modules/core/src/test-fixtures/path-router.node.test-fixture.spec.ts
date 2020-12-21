import {PathRouterNode} from "../network/path-router.node";
import {MethodRouterNode} from "../network/method-router.node";
import {HttpMethod} from "../enums/http-method.enum";

export const pathRouterNode = (): PathRouterNode => {

    const root = new PathRouterNode("/", null)

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

    return root;
};