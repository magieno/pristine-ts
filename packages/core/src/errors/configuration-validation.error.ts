export class ConfigurationValidationError extends Error {
    public constructor(message: string) {
        super(message);

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, ConfigurationValidationError.prototype);
    }
}