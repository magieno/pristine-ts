import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {AuthenticatorClass} from "../types/authenticator-class.type";
import {AuthenticatorDecoratorError} from "../errors/authenticator-decorator.error";
import {MetadataUtil} from "@pristine-ts/common";

export const authenticatorMetadataKeyname = "@authenticator";

/**
 * This decorator specifies the authenticator that should be used to authenticate a request.
 * It should be used either on a controller class or directly on a method.
 *
 * When the authenticator class advertises an options type (via a phantom static
 * `__options` field, see {@link AuthenticatorClass}), `options` is type-checked against it
 * at the call site — e.g. `@authenticator(Auth0Authenticator, {expectedAudience})` is
 * validated against `Auth0AuthenticatorOptionsInterface`. Authenticators without that
 * marker keep accepting any options (unchanged behavior).
 *
 * @typeParam TOptions The options type, inferred from the authenticator class. `NoInfer`
 *   keeps it pinned to the class's declared type so the `options` argument is *checked*
 *   against it rather than being used to (re)infer it.
 * @param authenticator The authenticator to use.
 * @param options Any options that will be passed on to the authenticator.
 */
export const authenticator = <TOptions = any>(authenticator: AuthenticatorClass<TOptions> | AuthenticatorInterface, options?: NoInfer<TOptions>) => {
  return (target: any,
          propertyKey?: string,
          descriptor?: PropertyDescriptor) => {


    // This is the condition to check that the authenticator is valid.
    if (!(authenticator && (
      (typeof authenticator === 'function' && typeof (authenticator as any).prototype.authenticate === 'function' && typeof (authenticator as any).prototype.setContext === 'function') ||
      (typeof authenticator === 'object' && typeof authenticator.authenticate === 'function' && typeof authenticator.setContext === 'function')
    ))) {
      throw new AuthenticatorDecoratorError("The authenticator isn't valid. It isn't a function or doesn't implement both the 'authenticate' and the 'setContext' methods.", authenticator, options, target, propertyKey, descriptor);
    }

    // Construct the Guard Context.
    const authenticatorContext: AuthenticatorContextInterface = {
      constructorName: (authenticator as any).prototype.constructor.name,
      authenticator,
      options,
    };

    MetadataUtil.setToRouteContext(authenticatorMetadataKeyname, authenticatorContext, target, propertyKey);
  }
}
