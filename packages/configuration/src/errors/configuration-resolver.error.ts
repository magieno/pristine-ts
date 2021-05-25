import {LoggableError} from "@pristine-ts/common";

export class ConfigurationResolverError extends LoggableError {
    public constructor(message: string, value) {
        super(message, {
            value,
            type: typeof(value),
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, ConfigurationResolverError.prototype);
    }
}
