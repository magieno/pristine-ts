import {LoggableError} from "@pristine-ts/common";

/**
 * This Error represents a configuration error when an error occurs in a resolver.
 */
export class ConfigurationResolverError extends LoggableError {
    public constructor(message: string, value: any) {
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
