import {RouterNode} from "./router.node";
import {HttpMethod} from "../enums/http-method.enum";
import {InitializationError} from "../errors/initialization.error";
import instance from "tsyringe/dist/typings/dependency-container";
import {MethodRouterNode} from "./method-router.node";
import * as Path from "path";

export class PathRouterNode extends RouterNode {
    public constructor(public readonly path: string, parent?: PathRouterNode) {
        super();

        if (path.startsWith("/") === false) {
            throw new InitializationError("The path must absolutely start with a '/', but you passed: '" + path + "'.");
        }

        this.parent = parent;
    }

    add<T>(splitPaths: string[], method: HttpMethod | string, data?: T) {
        // Check to make sure that the first split path matches the current node
        if (splitPaths.length < 1 || this.matches(splitPaths[0]) === false) {
            return;
        }

        // If the splitPaths[0] matches the current node and the length is 1, we create the MethodRouterNode and add it as a children
        if (splitPaths.length === 1) {
            // Make sure that for every MethodRouterNode children, this httpMethod doesn't already exist
            const matchedMethodRouterNodeChild = this.children.filter(child => child instanceof MethodRouterNode).find((child: MethodRouterNode<T>) => child.matches(method))

            if (matchedMethodRouterNodeChild !== undefined) {
                throw new InitializationError("There is already an HTTP Method associated with this path. Path: '" + splitPaths.join("") + "', Method: '" + method + "'")
            }

            this.children.push(new MethodRouterNode(this, method, data));
            return;
        }

        // Loop over our children that are of PathRouterNode and check if the next path matches
        const matchedChild = this.children.filter(child => child instanceof PathRouterNode).find((child: PathRouterNode) => child.matches(splitPaths[1]));

        // If there's a matched child, call the add httpMethod on it and return.
        if (matchedChild !== undefined) {
            matchedChild.add(splitPaths.slice(1), method, data);
            return;
        }

        // If the remaining path doesn't matches any children, we need to create it
        const pathRouterNode = new PathRouterNode(splitPaths[1], this);
        this.children.push(pathRouterNode);

        // Then, call add on the latest pathRouterNode child
        pathRouterNode.add(splitPaths.slice(1), method, data);
        return;
    }

    isRouteParameter(): boolean {
        // If the current path is a parameter path, meaning has services/{id-of-service}
        if (this.path.startsWith("/{") && this.path.endsWith("}")) {
            return true;
        }

        // We also support parameter path written as services/:id-of-service
        if (this.path.startsWith("/:")) {
            return true;
        }

        return false;
    }

    matches(path: string): boolean {
        if (this.isRouteParameter()) {
            return true;
        }

        return this.path === path;
    }

    find(splitPaths: string[], method: HttpMethod | string): RouterNode | null {
        // If splitPaths is 0 or if the first path doesn't match this current node, we return
        if (splitPaths.length < 1 || this.matches(splitPaths[0]) === false) {
            return null;
        }

        // Since we checked above if we didn't match, it means we match. We check if one of our children matches.
        for (const child of this.children) {
            const foundChild = child.find(splitPaths.slice(1), method);
            if (foundChild !== null) {
                return foundChild;
            }
        }

        return null;
    }

    /**
     * This httpMethod navigates the tree upwards
     *
     * @param splitPaths
     */
    getRouteParameter(splitPaths: string[]): { [key: string]: string } {
        let parameters = {};

        if (this.matches(splitPaths[0]) === true) {
            // If the current path is a parameter path, meaning has services/{id-of-service}
            if (this.path.startsWith("/{") && this.path.endsWith("}")) {
                const name = this.path.slice(2, this.path.length - 1);

                parameters[name] = splitPaths[0].slice(1, splitPaths[0].length);

            } else if (this.path.startsWith("/:")) {
                const name = this.path.slice(2, this.path.length);

                parameters[name] = splitPaths[0].slice(1, splitPaths[0].length);
            }
        }

        if (this.parent !== null) {
            const parent: PathRouterNode = this.parent as PathRouterNode;

            parameters = {...parameters, ...parent.getRouteParameter(splitPaths.slice(1))};
        }

        return parameters;
    }
}