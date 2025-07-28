import {LoggableError} from "@pristine-ts/common";
import {ExecutionContextInterface} from "../interfaces/execution-context.interface";

/**
 * This Error is thrown when there's an error when executing any event pre mapping interceptors.
 */
export class EventPreMappingInterceptionError extends LoggableError {

  public constructor(message: string, originalError: Error, interceptorName: string, event: object, executionContext: ExecutionContextInterface<any>) {
    super(message, {
      originalError,
      event,
      interceptorName,
      executionContext,
    });

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, EventPreMappingInterceptionError.prototype);
  }
}
