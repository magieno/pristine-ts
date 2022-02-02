import {LoggableError} from "@pristine-ts/common";
import {GuardInterface} from "../interfaces/guard.interface";

/**
 * This Error is thrown when there's an error that happens when the guards ere being initialized
 */
export class GuardInstantiationError extends LoggableError {
    public constructor(message: string, instantiatedGuard: GuardInterface | Function, guardContext: any) {
        super(message, {
            instantiatedGuard,
            guardContext,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, GuardInstantiationError.prototype);
    }
}
