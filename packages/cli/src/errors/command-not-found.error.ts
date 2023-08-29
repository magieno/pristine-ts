import {LoggableError} from "@pristine-ts/common";

/**
 * The CommandNotFoundError error when the command specified is not implemented.
 */
export class CommandNotFoundError extends LoggableError {
    /**
     * This Error is the base class for CommandNotFoundError errors.
     * @param commandName The name of the command that could not be found
     */
    public constructor(
                       public readonly commandName: string,
    ) {
        super("There is no command found for name: '" + commandName + "'. Use the 'list' command to see the commands already registered.", {
            commandName
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, CommandNotFoundError.prototype);
    }
}
