import {HttpMethod, LoggableError} from "@pristine-ts/common";
import {Route} from "../models/route";
import {MethodRouterNode} from "../nodes/method-router.node";

/**
 * This Error is thrown when there's an error that happens when the networking is being initialized.
 * It is thrown when trying to add a child node to a MethodRouterNode, since a MethodRouterNode is a leaf it cannot have any children.
 */
export class MethodRouterAddingError extends LoggableError {

    public constructor(message: string, splitPaths: string[], method: HttpMethod | string, route: Route, methodRouterNode: MethodRouterNode) {
        super(message, {
            splitPaths,
            method,
            route,
            methodRouterNode,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, MethodRouterNode.prototype);    }
}
