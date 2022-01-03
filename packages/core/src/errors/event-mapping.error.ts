import {LoggableError} from "@pristine-ts/common";
import {ExecutionContextInterface} from "../interfaces/execution-context.interface";

/**
 * This Error is thrown when there's an error that happens while trying to register a Provider registration.
 */
export class EventMappingError extends LoggableError {

    public constructor(message: string, event: object, interceptedEvent: object, executionContext: ExecutionContextInterface<any>) {
        super(message, {
            event,
            interceptedEvent,
            executionContext,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, EventMappingError.prototype);
    }
}
