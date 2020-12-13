import {RouterNode} from "./router.node";
import {HttpMethod} from "../enums/http-method.enum";
import {InitializationError} from "../errors/initialization.error";
import instance from "tsyringe/dist/typings/dependency-container";
import {MethodRouterNode} from "./method-router.node";

export class PathRouterNode extends RouterNode {
    public constructor(public readonly path: string, parent?: PathRouterNode) {
        super();

        if(path.startsWith("/") === false) {
            throw new InitializationError("The path must absolutely start with a '/', but you passed: '" + path + "'.");
        }

        this.parent = parent;
    }

    add(splitPaths: string[], method: HttpMethod) {
        // Check to make sure that the first split path matches the current node
        if(splitPaths.length < 1 || this.matches(splitPaths[0]) === false) {
            return;
        }

        // If the splitPaths[0] matches the current node and the length is 1, we create the MethodRouterNode and add it as a children
        if(splitPaths.length === 1) {
            // Make sure that for every MethodRouterNode children, this method doesn't already exist
            const matchedMethodRouterNodeChild = this.children.filter(child => child instanceof MethodRouterNode).find((child: MethodRouterNode) => child.matches(method))

            if(matchedMethodRouterNodeChild !== undefined) {
                throw new InitializationError("There is already an HTTP Method associated with this path. Path: '" + splitPaths.join("") + "', Method: '" + method + "'")
            }

            this.children.push(new MethodRouterNode(this, method));
            return;
        }

        // Loop over our children that are of PathRouterNode and check if the next path matches
        const matchedChild = this.children.filter(child => child instanceof PathRouterNode).find( (child: PathRouterNode) => child.matches(splitPaths[1]));

        // If there's a matched child, call the add method on it and return.
        if(matchedChild !== undefined) {
            matchedChild.add(splitPaths.slice(1), method);
            return;
        }

        // If the remaining path doesn't matches any children, we need to create it
        const pathRouterNode = new PathRouterNode(splitPaths[1], this);
        this.children.push(pathRouterNode);

        // Then, call add on the latest pathRouterNode child
        pathRouterNode.add(splitPaths.slice(1), method);
        return;
    }

    matches(path: string): boolean {
        // todo: Handle path that is a parameter, e.g.: {id} or :id since they will not match
        return this.path === path;
    }

    find(splitPaths: string[], method: HttpMethod): RouterNode | null {
        // If splitPaths is 0 or if the first path doesn't match this current node, we return
        if(splitPaths.length < 1 || this.matches(splitPaths[0]) === false) {
            return null;
        }

        // Since we checked above if we didn't match, it means we match. We check if one of our children matches.
        for (const child of this.children) {
            const foundChild = child.find(splitPaths.slice(1), method);
            if(foundChild !== null) {
                return foundChild;
            }
        }

        return null;
    }
}