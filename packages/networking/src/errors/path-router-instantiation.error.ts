import {PristineError} from "@pristine-ts/common";
import {PathRouterNode} from "../nodes/path-router.node";

/**
 * This Error is thrown when there's an error that happens when the networking is being initialized.
 * It is thrown when an error occurs when trying to instantiate a PathRouterNode.
 */
export class PathRouterInstantiationError extends PristineError {

  public constructor(message: string, path: string, parent?: PathRouterNode) {
    super(message, {details: {
      path,
      parent,
    }});  }
}
