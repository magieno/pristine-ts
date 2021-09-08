import {EventParserInterface} from "../interfaces/event-parser.interface";
import {LoggableError} from "@pristine-ts/common";

/**
 * This Error is thrown when an error happens while trying to transform an event.
 */
export class EventTransformError extends LoggableError {

    /**
     * This Error is thrown when an error happens while trying to transform an event.
     * @param message The error message.
     * @param event The event that caused the error.
     * @param eventParsers The event parsers that were registered.
     */
    public constructor(message: string, event: any, eventParsers: EventParserInterface<any>[]) {
        super(message, {
            event,
            eventParsers,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, EventTransformError.prototype);    }
}
