import {LoggableError} from "@pristine-ts/common";
import {Event} from "../models/event";

/**
 * This Error is thrown when there's an error when dispatching an event.
 */
export class EventDispatchingError extends LoggableError {

  public constructor(message: string, originalError: Error, event: Event<any>) {
    super(message, {
      originalError,
      event,
    });

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, EventDispatchingError.prototype);
  }
}
