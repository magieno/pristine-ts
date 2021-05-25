import {LoggableError} from "@pristine-ts/common";

export class ConfigurationDefinitionAlreadyExistsError extends LoggableError {
    public constructor(message: string, parameterName: string) {
        super(message, {parameterName});

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, ConfigurationDefinitionAlreadyExistsError.prototype);
    }
}
