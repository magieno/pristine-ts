import {LoggableError} from "@pristine-ts/common";
import {ExecutionContextInterface} from "../interfaces/execution-context.interface";
import {EventResponse} from "../models/event.response";

/**
 * This Error is thrown when there's an error when executing any event pre mapping interceptors.
 */
export class EventPostResponseMappingInterceptionError extends LoggableError {

    public constructor(message: string, originalError: Error, interceptorName: string, eventResponse: object) {
        super(message, {
            originalError,
            interceptorName,
            eventResponse,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, EventPostResponseMappingInterceptionError.prototype);
    }
}
