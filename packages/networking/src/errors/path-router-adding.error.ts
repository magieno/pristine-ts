import {HttpMethod, PristineError} from "@pristine-ts/common";
import {PathRouterNode} from "../nodes/path-router.node";
import {Route} from "../models/route";

/**
 * This Error is thrown when there's an error that happens when the networking is being initialized.
 * It is thrown when an error occurs when trying to add a child node to a PathRouterNode.
 */
export class PathRouterAddingError extends PristineError {

  public constructor(message: string, splitPaths: string[], method: HttpMethod | string, route: Route, pathRouterNode: PathRouterNode) {
    super(message, {details: {
      splitPaths,
      method,
      route,
      pathRouterNode,
    }});  }
}
