/**
 * This Error is thrown when there's an error that happens when the networking is being initialized
 */
import {HttpMethod, LoggableError} from "@pristine-ts/common";
import {PathRouterNode} from "../nodes/path-router.node";
import {Route} from "../models/route";

export class PathRouterAddingError extends LoggableError {

    public constructor(message: string, splitPaths: string[], method: HttpMethod | string, route: Route, pathRouterNode: PathRouterNode) {
        super(message, {
            splitPaths,
            method,
            route,
            pathRouterNode,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, PathRouterAddingError.prototype);    }
}
