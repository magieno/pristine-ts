import {LoggableError} from "@pristine-ts/common";
import {Kernel} from "../kernel";

/**
 * This Error is thrown when an error happens in the execution of an event interceptor.
 */
export class EventInterceptionExecutionError extends LoggableError {

  public constructor(message: string, event: any, kernel: Kernel, error?: Error) {
    super(message, {
      error,
      event,
      kernel,
    });

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, EventInterceptionExecutionError.prototype);
  }
}
