import {RouterNode} from "./router.node";
import {HttpMethod} from "../enums/http-method.enum";
import {PathRouterNode} from "./path-router.node";

export class MethodRouterNode<T> extends RouterNode {
    public constructor(parent: PathRouterNode, public readonly method: HttpMethod, public readonly data?: T) {
        super();

        this.parent = parent;
    }

    matches(method: HttpMethod): boolean {
        return this.method === method;
    }

    add(splitPaths: string[], method: HttpMethod) {
    }

    find(splitPaths: string[], method: HttpMethod): RouterNode | null {
        return splitPaths.length === 0 && this.matches(method) ? this : null;
    }

}