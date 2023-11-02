import {LoggableError} from "@pristine-ts/common";
import {Request} from "@pristine-ts/common";

/**
 * This Error is thrown when a property isn't optional and should be found in the source object.
 */
export class DataTransformerSourcePropertyNotFoundError extends LoggableError {

    public constructor(message: string, sourceProperty: string) {
        super(message, {
            sourceProperty,
        });


        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, DataTransformerSourcePropertyNotFoundError.prototype);
    }
}
