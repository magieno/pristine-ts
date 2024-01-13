import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {AuthenticatorDecoratorError} from "../errors/authenticator-decorator.error";

export const authenticatorMetadataKeyname = "@controller:authenticator";

/**
 * This decorator specifies the authenticator that should be used to authenticate a request.
 * It should be used either on a controller class or directly on a method.
 * @param authenticator The authenticator to use.
 * @param options Any options that will be passed on to the authenticator.
 */
export const authenticator = (authenticator: AuthenticatorInterface | Function, options?: any) => {
    return ( target: any,
             propertyKey?: string,
             descriptor?: PropertyDescriptor) => {


        // This is the condition to check that the authenticator is valid.
        if(!(authenticator && (
            (typeof authenticator === 'function' && typeof authenticator.prototype.authenticate === 'function' && typeof authenticator.prototype.setContext === 'function') ||
            (typeof authenticator === 'object' && typeof authenticator.authenticate === 'function' && typeof authenticator.setContext === 'function')
        ))) {
            throw new AuthenticatorDecoratorError("The authenticator isn't valid. It isn't a function or doesn't implement both the 'authenticate' and the 'setContext' methods.", authenticator, options, target, propertyKey, descriptor);
        }

        // Construct the Guard Context.
        const authenticatorContext: AuthenticatorContextInterface =  {
            constructorName: (authenticator as any).prototype.constructor.name,
            authenticator,
            options,
        };

        // If there's a descriptor, then it's not a controller authenticator, but a method authenticator
        if(descriptor && propertyKey) {
            Reflect.defineMetadata(authenticatorMetadataKeyname, authenticatorContext, target, propertyKey);
        } else {
            Reflect.defineMetadata(authenticatorMetadataKeyname, authenticatorContext, target);
        }
    }
}
