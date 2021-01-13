import {RouterNode} from "./router.node";
import {HttpMethod} from "../enums/http-method.enum";
import {PathRouterNode} from "./path-router.node";
import {Route} from "../models/route";

/**
 * This class represents the Leaf node of the RouteTree.
 */
export class MethodRouterNode extends RouterNode {
    public constructor(parent: PathRouterNode, public readonly method: HttpMethod | string, public readonly route: Route) {
        super();

        this.parent = parent;
    }

    matches(method: HttpMethod | string): boolean {
        return this.method === method;
    }

    /**
     * This method adds all the required nodes to match the splitPaths and the method.
     *
     * @param splitPaths
     * @param method
     * @param route
     */
    add(splitPaths: string[], method: HttpMethod | string, route: Route) {
    }

    /**
     * This method receives an array of path and recursively calls its children if this node matches
     * the first splitPath. If the node is a MethodRouterNode, it checks to see if the method matches. If yes,
     * it returns itself as the node found. This method should always return a MethodRouterNode. However, Typescript
     * doesn't like these recursive imports so we return the base class
     *
     * @param splitPaths
     * @param method
     */
    find(splitPaths: string[], method: HttpMethod | string): RouterNode | null {
        return splitPaths.length === 0 && this.matches(method) ? this : null;
    }
}