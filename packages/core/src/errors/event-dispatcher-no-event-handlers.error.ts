import {PristineError} from "@pristine-ts/common";
import {Event} from "../models/event";

/**
 * This Error is thrown when there are not event handlers that support this event.
 */
export class EventDispatcherNoEventHandlersError extends PristineError {

  public constructor(message: string, event: Event<any>) {
    super(message, {details: {
      event,
    }});  }
}
