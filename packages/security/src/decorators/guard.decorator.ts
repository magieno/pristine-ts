import {GuardInterface} from "../interfaces/guard.interface";
import {GuardInitializationError} from "../errors/guard-initialization.error";

export const guard = (guard: GuardInterface | Function, options?: any) => {
    return ( target: any,
             propertyKey?: string,
             descriptor?: PropertyDescriptor) => {

        // Validate the interface of the guard
        guard => {
            // This is the condition to check that the guard is valid.
            if(guard && (
                (typeof guard === 'function' && typeof guard.prototype.isAuthorized === 'function') ||
                (typeof guard === 'object' && typeof guard.isAuthorized === 'function')
            )) {
                return;
            }

            throw new GuardInitializationError("The guard: '" + guard + "' isn't valid. It isn't a function or doesn't implement the 'isAuthorized' method.");
        }

        // If there's a descriptor, then it's not a controller guard, but a method guard
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

            if(target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"].hasOwnProperty("guards") === false) {
                target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"]["guards"] = []
            }

            //todo: how to access cleanly the prototype of a Function or an object.
            target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"]["guards"].push({
                guard,
                options
            });
        }
        else {
            if(target.prototype.hasOwnProperty("__metadata__") === false) {
                target.prototype["__metadata__"] = {}
            }

            if(target.prototype["__metadata__"].hasOwnProperty("controller") === false) {
                target.prototype["__metadata__"]["controller"] = {}
            }
            if (target.prototype["__metadata__"]["controller"].hasOwnProperty("__routeContext__") === false) {
                target.prototype["__metadata__"]["controller"]["__routeContext__"] = {}
            }

            if(target.prototype["__metadata__"]["controller"]["__routeContext__"].hasOwnProperty("guards") === false) {
                target.prototype["__metadata__"]["controller"]["__routeContext__"]["guards"] = []
            }

            target.prototype["__metadata__"]["controller"]["__routeContext__"]["guards"].push({
                guard,
                options
            });

            const a = 0;
        }
    }
}
