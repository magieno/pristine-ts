import {RouterNode} from "./router.node";
import {HttpMethod} from "@pristine-ts/common";
import {PathRouterNode} from "./path-router.node";
import {Route} from "../models/route";
import {MethodRouterAddingError} from "../errors/method-router-adding.error";

/**
 * This class represents the Leaf node of the RouteTree.
 * It will always have a parent node that will be a PathRouterNode.
 */
export class MethodRouterNode extends RouterNode {
    /**
     * @param parent The parent node of the current node.
     * @param method The http method of the current method node.
     * @param route The route associated with the current node.
     * @param levelFromRoot The depth level from the root node.
     */
    public constructor(parent: PathRouterNode, public readonly method: HttpMethod | string, public readonly route: Route, public readonly levelFromRoot: number) {
        super();

        this.parent = parent;
    }

    /**
     * Returns whether or not the node matches.
     * This verification is made by verify the http method matches with the http method of the current node.
     * @param method The http method to compare.
     */
    matches(method: HttpMethod | string): boolean {
        return this.method === method;
    }

    /**
     * A MethodRouterNode is never a catch-all node.
     */
    isCatchAll(): boolean {
        return false;
    }

    /**
     * This method adds all the required nodes to match the splitPaths and the method.
     * Since a MethodRouterNode is a leaf node, you can't add anything after it, this method therefore doesn't do anything.
     * @param splitPaths
     * @param method
     * @param route
     */
    add(splitPaths: string[], method: HttpMethod | string, route: Route) {
        throw new MethodRouterAddingError("Impossible to add a child node to a MethodRouterNode.", splitPaths, method, route, this);
    }

    /**
     * This method receives an array of path and recursively calls its children if this node matches
     * the first splitPath. If the node is a MethodRouterNode, it checks to see if the method matches. If yes,
     * it returns itself as the node found. This method should always return a MethodRouterNode. However, Typescript
     * doesn't like these recursive imports so we return the base class
     *
     * @param splitPaths A list of all the parts of the paths spliced at the forward slashes.
     * @param method The http method for which to find a node.
     */
    find(splitPaths: string[], method: HttpMethod | string): RouterNode | null {
        if(this.parent!.isCatchAll()) {
            return this.matches(method) ? this : null;
        }

        return (splitPaths.length === 0 && this.matches(method)) ? this : null;
    }
}
