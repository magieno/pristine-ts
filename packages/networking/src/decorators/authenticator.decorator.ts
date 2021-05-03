import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {AuthenticatorInitializationError} from "../errors/authenticator-initialization.error";

export const authenticator = (authenticator: AuthenticatorInterface | Function) => {
    return ( target: any,
             propertyKey?: string,
             descriptor?: PropertyDescriptor) => {


        // This is the condition to check that the authenticator is valid.
        if(!(authenticator && (
            (typeof authenticator === 'function' && typeof authenticator.prototype.authenticate === 'function') ||
            (typeof authenticator === 'object' && typeof authenticator.authenticate === 'function')
        ))) {
            throw new AuthenticatorInitializationError("The authenticator: '" + authenticator + "' isn't valid. It isn't a function or doesn't implement the 'authenticate' method.");
        }


        // If there's a descriptor, then it's not a controller authenticator, but a method authenticator
        if(descriptor && propertyKey) {
            if(target.constructor.prototype.hasOwnProperty("__metadata__") === false) {
                target.constructor.prototype["__metadata__"] = {}
            }

            if(target.constructor.prototype["__metadata__"].hasOwnProperty("methods") === false) {
                target.constructor.prototype["__metadata__"]["methods"] = {}
            }

            if(target.constructor.prototype["__metadata__"]["methods"].hasOwnProperty(propertyKey) === false) {
                target.constructor.prototype["__metadata__"]["methods"][propertyKey] = {}
            }

            target.constructor.prototype["__metadata__"]["methods"][propertyKey]["authenticator"] = authenticator;
        } else {
            if (target.prototype.hasOwnProperty("__metadata__") === false) {
                target.prototype["__metadata__"] = {}
            }

            if (target.prototype["__metadata__"].hasOwnProperty("controller") === false) {
                target.prototype["__metadata__"]["controller"] = {}
            }

            target.prototype["__metadata__"]["controller"]["authenticator"] = authenticator;
        }
    }
}
