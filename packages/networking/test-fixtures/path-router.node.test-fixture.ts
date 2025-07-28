import {PathRouterNode} from "../src/nodes/path-router.node";
import {MethodRouterNode} from "../src/nodes/method-router.node";
import {Route} from "../src/models/route";
import {HttpMethod} from "@pristine-ts/common";

export const pathRouterNode = (): PathRouterNode => {

  const root = new PathRouterNode("/", undefined)

  const api = new PathRouterNode("/api", root);

// API 1.0
  const apiVersion10 = new PathRouterNode("/1.0", api);
  const dogs = new PathRouterNode("/dogs", apiVersion10);
  const getDogs = new MethodRouterNode(dogs, HttpMethod.Get, new Route("controller", "key"), 5);
  const postDogs = new MethodRouterNode(dogs, HttpMethod.Post, new Route("controller", "key"), 5);

  const dog = new PathRouterNode("/{id}", dogs)
  const getDog = new MethodRouterNode(dog, HttpMethod.Get, new Route("controller", "key"), 6);
  const putDog = new MethodRouterNode(dog, HttpMethod.Put, new Route("controller", "key"), 6);
  const patchDog = new MethodRouterNode(dog, HttpMethod.Patch, new Route("controller", "key"), 6);
  const deleteDog = new MethodRouterNode(dog, HttpMethod.Delete, new Route("controller", "key"), 6);

  const puppies = new PathRouterNode("/puppies", dog);
  const getPuppies = new MethodRouterNode(puppies, HttpMethod.Get, new Route("controller", "key"), 7);
  const postPuppies = new MethodRouterNode(puppies, HttpMethod.Post, new Route("controller", "key"), 7);

  const puppy = new PathRouterNode("/{puppyId}", puppies)
  const getPuppy = new MethodRouterNode(puppy, HttpMethod.Get, new Route("controller", "key"), 8);
  const putPuppy = new MethodRouterNode(puppy, HttpMethod.Put, new Route("controller", "key"), 8);
  const patchPuppy = new MethodRouterNode(puppy, HttpMethod.Patch, new Route("controller", "key"), 8);
  const deletePuppy = new MethodRouterNode(puppy, HttpMethod.Delete, new Route("controller", "key"), 8);

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
  const getCats = new MethodRouterNode(cats, HttpMethod.Get, new Route("controller", "key"), 5);
  const postCats = new MethodRouterNode(cats, HttpMethod.Post, new Route("controller", "key"), 5);

  const cat = new PathRouterNode("/:id", cats)
  const getCat = new MethodRouterNode(cat, HttpMethod.Get, new Route("controller", "key"), 6);
  const putCat = new MethodRouterNode(cat, HttpMethod.Put, new Route("controller", "key"), 6);
  const patchCat = new MethodRouterNode(cat, HttpMethod.Patch, new Route("controller", "key"), 6);
  const deleteCat = new MethodRouterNode(cat, HttpMethod.Delete, new Route("controller", "key"), 6);

  const kittens = new PathRouterNode("/kittens", dog);
  const getKittens = new MethodRouterNode(kittens, HttpMethod.Get, new Route("controller", "key"), 7);
  const postKittens = new MethodRouterNode(kittens, HttpMethod.Post, new Route("controller", "key"), 7);

  const kitten = new PathRouterNode("/:kittenId", kittens)
  const getKitten = new MethodRouterNode(kitten, HttpMethod.Get, new Route("controller", "key"), 9);
  const putKitten = new MethodRouterNode(kitten, HttpMethod.Put, new Route("controller", "key"), 9);
  const patchKitten = new MethodRouterNode(kitten, HttpMethod.Patch, new Route("controller", "key"), 9);
  const deleteKitten = new MethodRouterNode(kitten, HttpMethod.Delete, new Route("controller", "key"), 9);

  const frogs = new PathRouterNode("/frogs", apiVersion20)
  const catchAllFrogs = new PathRouterNode("/*", frogs)
  const optionsFrog = new MethodRouterNode(catchAllFrogs, HttpMethod.Options, new Route("controller", "key"), 6);

  const beavers = new PathRouterNode("/beavers", apiVersion20)
  const catchAllBeavers = new PathRouterNode("/*", beavers)
  const getAllBeavers = new MethodRouterNode(catchAllBeavers, HttpMethod.Get, new Route("controller", "key"), 6);

  const beaver = new PathRouterNode("/:beaverId", beavers)
  const getBeaver = new MethodRouterNode(beaver, HttpMethod.Get, new Route("controller", "key"), 7);

  const childBeaver = new PathRouterNode("/*", beaver)
  const getChildBeaver = new MethodRouterNode(childBeaver, HttpMethod.Get, new Route("controller", "key"), 8);

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

  apiVersion20.children.push(frogs);
  frogs.children.push(catchAllFrogs);
  catchAllFrogs.children.push(optionsFrog);


  apiVersion20.children.push(beavers);
  beavers.children.push(catchAllBeavers);
  beavers.children.push(beaver);

  catchAllBeavers.children.push(getAllBeavers);
  beaver.children.push(getBeaver);

  beaver.children.push(childBeaver);
  childBeaver.children.push(getChildBeaver)

  root.children.push(api);

  return root;
};
