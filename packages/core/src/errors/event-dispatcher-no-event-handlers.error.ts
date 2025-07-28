import {LoggableError} from "@pristine-ts/common";
import {Event} from "../models/event";

/**
 * This Error is thrown when there are not event handlers that support this event.
 */
export class EventDispatcherNoEventHandlersError extends LoggableError {

  public constructor(message: string, event: Event<any>) {
    super(message, {
      event,
    });

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, EventDispatcherNoEventHandlersError.prototype);
  }
}
