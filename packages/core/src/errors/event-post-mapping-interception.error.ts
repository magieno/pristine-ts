import {LoggableError} from "@pristine-ts/common";
import {ExecutionContextInterface} from "../interfaces/execution-context.interface";
import {Event} from "../models/event";

/**
 * This Error is thrown when there's an error when executing any event post mapping interceptors.
 */
export class EventPostMappingInterceptionError extends LoggableError {

    public constructor(message: string, originalError: Error, interceptorName: string, event: Event<any>) {
        super(message, {
            originalError,
            interceptorName,
            event,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, EventPostMappingInterceptionError.prototype);
    }
}
