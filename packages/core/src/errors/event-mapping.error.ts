import {LoggableError} from "@pristine-ts/common";
import {ExecutionContextInterface} from "../interfaces/execution-context.interface";

/**
 * This Error is thrown when there's an error while Mapping an Event in the EventPipeline
 */
export class EventMappingError extends LoggableError {

    public constructor(message: string, event: object, interceptedEvent: object, executionContext: ExecutionContextInterface<any>, originalError?: Error) {
        super(message, {
            event,
            interceptedEvent,
            executionContext,
            originalError,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, EventMappingError.prototype);
    }
}
