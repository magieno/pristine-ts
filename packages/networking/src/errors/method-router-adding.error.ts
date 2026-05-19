import {HttpMethod, PristineError} from "@pristine-ts/common";
import {Route} from "../models/route";
import {MethodRouterNode} from "../nodes/method-router.node";

/**
 * This Error is thrown when there's an error that happens when the networking is being initialized.
 * It is thrown when trying to add a child node to a MethodRouterNode, since a MethodRouterNode is a leaf it cannot have any children.
 */
export class MethodRouterAddingError extends PristineError {

  public constructor(message: string, splitPaths: string[], method: HttpMethod | string, route: Route, methodRouterNode: MethodRouterNode) {
    super(message, {details: {
      splitPaths,
      method,
      route,
      methodRouterNode,
    }});  }
}
