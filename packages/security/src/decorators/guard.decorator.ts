import {GuardInterface} from "../interfaces/guard.interface";
import {GuardDecoratorError} from "../errors/guard-decorator.error";
import {GuardContextInterface} from "../interfaces/guard-context.interface";

export const guardsMetadataKeyname = "@controller:guards";

/**
 * This decorator specifies the guard that should be used to authorize a request.
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
            const guards = Reflect.getMetadata(guardsMetadataKeyname, target, propertyKey) ?? [];

            guards.push(guardContext);

            Reflect.defineMetadata(guardsMetadataKeyname, guards, target, propertyKey);
        }
        else {
            const guards = Reflect.getMetadata(guardsMetadataKeyname, target) ?? [];

            guards.push(guardContext);

            Reflect.defineMetadata(guardsMetadataKeyname, guards, target);
        }
    }
}
