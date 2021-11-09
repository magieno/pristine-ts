import {RouterNode} from "./router.node";
import {HttpMethod} from "@pristine-ts/common";
import {MethodRouterNode} from "./method-router.node";
import {Route} from "../models/route";
import {PathRouterInstantiationError} from "../errors/path-router-instantiation.error";
import {PathRouterAddingError} from "../errors/path-router-adding.error";

/**
 * This class represents a Path Node in the Router Node. It can never be a leaf node and will always have children.
 */
export class PathRouterNode extends RouterNode {
    /**
     * @param path The path associated with the current node.
     * @param parent The parent node of the current node.
     */
    public constructor(public readonly path: string, parent?: PathRouterNode) {
        super();

        if (path.startsWith("/") === false) {
            throw new PathRouterInstantiationError("The path must absolutely start with a '/'.", path, parent);
        }

        this.parent = parent;
    }

    /**
     * This method adds all the required nodes to match the splitPaths and the method.
     *
     * @param splitPaths A list of all the parts of the paths spliced at the forward slashes.
     * @param method The http method for this route.
     * @param route The route.
     */
    add(splitPaths: string[], method: HttpMethod | string, route: Route) {
        // Check to make sure that the first split path matches the current node
        if (splitPaths.length < 1 || this.matches(splitPaths[0]) === false) {
            return;
        }

        // If the splitPaths[0] matches the current node and the length is 1, we create the MethodRouterNode and add it as a children
        if (splitPaths.length === 1) {
            // Make sure that for every MethodRouterNode children, this httpMethod doesn't already exist
            const matchedMethodRouterNodeChild = this.children.filter(child => child instanceof MethodRouterNode).find((child: MethodRouterNode) => child.matches(method))

            if (matchedMethodRouterNodeChild !== undefined) {
                throw new PathRouterAddingError("There is already an HTTP Method associated with this path.", splitPaths, method, route, this);
            }

            // Add a new child node of type MethodRouterNode for this new http method.
            this.children.push(new MethodRouterNode(this, method, route));
            return;
        }

        // Loop over our children that are of PathRouterNode and check if the next path matches
        const matchedChild = this.children.filter(child => child instanceof PathRouterNode).find((child: PathRouterNode) => child.matches(splitPaths[1]));

        // If there's a matched child, call the add method on it and return.
        if (matchedChild !== undefined) {
            // Remove the first part of the path as it is used by the current node.
            matchedChild.add(splitPaths.slice(1), method, route);
            return;
        }

        // If the remaining path doesn't matches any children, we need to create it
        const pathRouterNode = new PathRouterNode(splitPaths[1], this);
        this.children.push(pathRouterNode);

        // Then, call add on the latest pathRouterNode child
        // Remove the first part of the path as it is used by the current node.
        pathRouterNode.add(splitPaths.slice(1), method, route);
        return;
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
        // If splitPaths is 0 or if the first path doesn't match this current node, we return
        if (splitPaths.length < 1 || this.matches(splitPaths[0]) === false) {
            return null;
        }

        // Since we checked above if we didn't match, it means we match.
        // We check if one of our children matches the next part of the path.
        for (const child of this.children) {
            const foundChild = child.find(splitPaths.slice(1), method);
            if (foundChild !== null) {
                return foundChild;
            }
        }

        return null;
    }

    /**
     * This httpMethod navigates the tree upwards and returns all the routeParameters
     *
     * @param splitPaths A list of all the parts of the paths spliced at the forward slashes.
     */
    getRouteParameters(splitPaths: string[]): { [key: string]: string } {
        let parameters = {};

        if (this.matches(splitPaths[0])) {
            // If the current path is a path parameter
            // We support both ways of setting a path parameter, either curly brackets, or colons
            // ie: services/{serviceId} or service/:serviceId
            if (this.path.startsWith("/{") && this.path.endsWith("}")) {
                const name = this.path.slice(2, this.path.length - 1);

                parameters[name] = splitPaths[0].slice(1, splitPaths[0].length);

            } else if (this.path.startsWith("/:")) {
                const name = this.path.slice(2, this.path.length);

                parameters[name] = splitPaths[0].slice(1, splitPaths[0].length);
            }
        }

        // If our parent isn't undefined, then we recursively navigate it to return all the parameters.
        if (this.parent !== undefined) {
            const parent: PathRouterNode = this.parent as PathRouterNode;

            parameters = {...parameters, ...parent.getRouteParameters(splitPaths.slice(1))};
        }

        return parameters;
    }

    /**
     * This method returns whether or not this pathRouterNode represents a route parameter, e.g.: /{id} or /:id
     */
    isRouteParameter(): boolean {
        // If the current path is a path parameter, meaning has services/{id-of-service}
        if (this.path.startsWith("/{") && this.path.endsWith("}")) {
            return true;
        }

        // We also support path parameter written as services/:id-of-service
        if (this.path.startsWith("/:")) {
            return true;
        }

        return false;
    }

    /**
     * This method returns whether the current path matches a path. We have to check if this node is a RouteParameter
     * since if it is, it will match it
     *
     * @param path
     */
    matches(path: string): boolean {
        if (this.isRouteParameter()) {
            return true;
        }

        return this.path === path;
    }
}
