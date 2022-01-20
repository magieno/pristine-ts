import {GuardInterface} from "../interfaces/guard.interface";
import {GuardDecoratorError} from "../errors/guard-decorator.error";
import {GuardContextInterface} from "../interfaces/guard-context.interface";

/**
 * This decorator is to specify the guard that should be used to authorize a request.
 * It should be used either on a controller class or directly on a method.
 * @param guard
 * @param options Any options that will be passed on to the guard.
 */
export const guard = (guard: GuardInterface | Function, options?: any) => {
    return ( target: any,
             propertyKey?: string,
             descriptor?: PropertyDescriptor) => {

        // Validate the interface of the guard
        if (!(guard && (
            (typeof guard === 'function' && typeof guard.prototype.isAuthorized === 'function') ||
            (typeof guard === 'object' && typeof guard.isAuthorized === 'function')
        ))) {
            throw new GuardDecoratorError("The guard isn't valid. It isn't a function or doesn't implement the 'isAuthorized' method.", guard, options, target, propertyKey, descriptor);
        }

        // Construct the Guard Context.
        const guardContext: GuardContextInterface =  {
            constructorName: (guard as any).prototype.constructor.name,
            guard,
            options,
        };

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

            target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"]["guards"].push(guardContext);
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

            target.prototype["__metadata__"]["controller"]["__routeContext__"]["guards"].push(guardContext);
        }
    }
}
