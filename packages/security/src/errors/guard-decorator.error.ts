/**
 * This Error is thrown when there's an error that happens when the guards ere being initialized
 */
import {LoggableError} from "@pristine-ts/common";

export class GuardDecoratorError extends LoggableError {

    public constructor(message: string, guard, options, target: any,
                       propertyKey?: string,
                       descriptor?: PropertyDescriptor) {
        super(message, {
            message,
            guard,
            options,
            target,
            propertyKey,
            descriptor,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, GuardDecoratorError.prototype);
    }
}
