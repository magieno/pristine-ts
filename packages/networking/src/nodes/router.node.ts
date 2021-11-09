import {HttpMethod} from "@pristine-ts/common";
import {Route} from "../models/route";

/**
 * The RouterNode is a base class of the RouteTree maintained in the Router. It builds a reference to all
 * the routes in a very nice tree format.
 */
export abstract class RouterNode {
    /**
     * The parent tree of the current node
     */
    parent?: RouterNode;

    /**
     * The list of the children node of this current node.
     */
    children: RouterNode[] = [];


    /**
     * This method adds all the required nodes to match the splitPaths and the method.
     *
     * @param splitPaths A list of all the parts of the paths spliced at the forward slashes.
     * @param method
     * @param route
     */
    abstract add(splitPaths: string[], method: HttpMethod | string, route: Route);

    /**
     * This method receives an array of path and recursively calls its children if this node matches
     * the first splitPath. If the node is a MethodRouterNode, it checks to see if the method matches. If yes,
     * it returns itself as the node found. This method should always return a MethodRouterNode. However, Typescript
     * doesn't like these recursive imports so we return the base class
     *
     * @param splitPaths A list of all the parts of the paths spliced at the forward slashes.
     * @param method The http method for which to find a node.
     */
    abstract find(splitPaths: string[], method: HttpMethod | string): RouterNode | null;
}
