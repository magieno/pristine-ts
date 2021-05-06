import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {AuthenticatorInitializationError} from "../errors/authenticator-initialization.error";
import {GuardContextInterface} from "../interfaces/guard-context.interface";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";

export const authenticator = (authenticator: AuthenticatorInterface | Function, options?: any) => {
    return ( target: any,
             propertyKey?: string,
             descriptor?: PropertyDescriptor) => {


        // This is the condition to check that the authenticator is valid.
        if(!(authenticator && (
            (typeof authenticator === 'function' && typeof authenticator.prototype.authenticate === 'function' && typeof authenticator.prototype.setContext === 'function') ||
            (typeof authenticator === 'object' && typeof authenticator.authenticate === 'function' && typeof authenticator.setContext === 'function')
        ))) {
            throw new AuthenticatorInitializationError("The authenticator: '" + authenticator + "' isn't valid. It isn't a function or doesn't implement both the 'authenticate' and the 'setContext' methods.");
        }

        // Construct the Guard Context.
        const authenticatorContext: AuthenticatorContextInterface =  {
            constructorName: (authenticator as any).prototype.constructor.name,
            authenticator,
            options,
        };

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

            if(target.constructor.prototype["__metadata__"]["methods"][propertyKey].hasOwnProperty("__routeContext__") === false) {
                target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"] = {}
            }

            target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"]["authenticator"] = authenticatorContext;
        } else {
            if (target.prototype.hasOwnProperty("__metadata__") === false) {
                target.prototype["__metadata__"] = {}
            }

            if (target.prototype["__metadata__"].hasOwnProperty("controller") === false) {
                target.prototype["__metadata__"]["controller"] = {}
            }

            if (target.prototype["__metadata__"]["controller"].hasOwnProperty("__routeContext__") === false) {
                target.prototype["__metadata__"]["controller"]["__routeContext__"] = {}
            }

            target.prototype["__metadata__"]["controller"]["__routeContext__"]["authenticator"] = authenticatorContext;
        }
    }
}
