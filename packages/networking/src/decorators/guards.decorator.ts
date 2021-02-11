import {GuardInterface} from "../interfaces/guard.interface";
import {controllerRegistry} from "./controller.decorator";
import {GuardInitializationError} from "../errors/guard-initialization.error";

export const guards = (...guards: (GuardInterface | Function) []) => {
    return ( target: any,
             propertyKey?: string,
             descriptor?: PropertyDescriptor) => {

        // Validate the interface of each guard
        guards.forEach(guard => {
            // This is the condition to check that the guard is valid.
            if(guard && (
                (typeof guard === 'function' && typeof guard.prototype.isAuthorized === 'function') ||
                (typeof guard === 'object' && typeof guard.isAuthorized === 'function')
            )) {
                return;
            }

            throw new GuardInitializationError("The guard: '" + guard + "' isn't valid. It isn't a function or doesn't implement the 'isAuthorized' method.");
        })

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

            target.constructor.prototype["__metadata__"]["methods"][propertyKey]["guards"] = guards;
        }
        else {
            if(target.prototype.hasOwnProperty("__metadata__") === false) {
                target.prototype["__metadata__"] = {}
            }

            if(target.prototype["__metadata__"].hasOwnProperty("controller") === false) {
                target.prototype["__metadata__"]["controller"] = {}
            }

            target.prototype["__metadata__"]["controller"]["guards"] = guards;
        }
    }
}