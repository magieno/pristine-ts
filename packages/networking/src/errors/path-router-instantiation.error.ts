import {LoggableError} from "@pristine-ts/common";
import {PathRouterNode} from "../nodes/path-router.node";

/**
 * This Error is thrown when there's an error that happens when the networking is being initialized.
 * It is thrown when an error occurs when trying to instantiate a PathRouterNode.
 */
export class PathRouterInstantiationError extends LoggableError {

  public constructor(message: string, path: string, parent?: PathRouterNode) {
    super(message, {
      path,
      parent,
    });

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, PathRouterInstantiationError.prototype);
  }
}
