import {Request} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {CachedRouterRoute} from "./cached.router-route";
import {MethodRouterNode} from "../nodes/method-router.node";
import {NetworkingModuleKeyname} from "../networking.module.keyname";

@injectable()
export class RouterCache {
  public routes: { [methodAndPath: string]: CachedRouterRoute } = {};

  public constructor(@inject(`%${NetworkingModuleKeyname}.routerCache.isActive%`) private readonly isActive: boolean) {
  }

  public get(keyname: string): CachedRouterRoute | undefined {
    if (this.isActive === false) {
      return undefined;
    }

    return this.routes[keyname];
  }

  public set(keyname: string, methodNode: MethodRouterNode): CachedRouterRoute {
    const cachedRouterRoute = new CachedRouterRoute(methodNode);

    if (this.isActive === false) {
      return cachedRouterRoute;
    }

    // todo Calculate the size and add it to the current total

    // Whenever we add a new element to the cache, we have to check if the cache needs to be cleaned
    this.cleanIfNeeded();

    this.routes[keyname] = cachedRouterRoute;

    return cachedRouterRoute;
  }

  public getCachedControllerMethodArguments(keyname: string, request: Request): any[] | undefined {
    if (this.isActive === false) {
      return undefined;
    }

    return this.routes[keyname]?.getCachedControllerMethodArguments(request);
  }

  public setControllerMethodArguments(keyname: string, request: Request, methodArguments: any[]) {
    if (this.isActive === false) {
      return;
    }

    this.routes[keyname]?.cacheControllerMethodArguments(request, methodArguments);

    return;
  }

  private cleanIfNeeded() {
    // todo: implement a proper LRU cache and also, remove the two layers of cache and flatten it to one.
  }

}