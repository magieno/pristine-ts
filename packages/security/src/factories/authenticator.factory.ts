import {DependencyContainer, injectable} from "tsyringe";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {AuthenticatorInstantiationError} from "../errors/authenticator-instantiation.error";

/**
 * The AuthenticatorFactory returns the proper instantiated authenticator.
 */
@injectable()
export class AuthenticatorFactory {

  /**
   * This function takes the authenticator context and returns the proper instantiated authenticator.
   * It also validates that the authenticator is valid (it implements the AuthenticatorInterface).
   * @param authenticatorContext The authenticator context that holds the authenticator and options to use.
   * @param container The dependency container from which to retrieve the instantiated authenticator.
   */
  fromContext(authenticatorContext: AuthenticatorContextInterface, container: DependencyContainer): AuthenticatorInterface {
    // Check if the guard needs to be instantiated
    let instantiatedAuthenticator: AuthenticatorInterface = authenticatorContext.authenticator as AuthenticatorInterface;

    // ── container.resolve, justified ────────────────────────────────────────────
    // Per CLAUDE.md: factory whose target class is data carried on the route's
    // `@authenticator(SomeAuth)` metadata. Token isn't known at factory construction;
    // resolving it is the factory's entire purpose. Per-event container passed in by
    // the router so the authenticator sees request-scoped dependencies.
    if (typeof instantiatedAuthenticator === 'function') {
      instantiatedAuthenticator = container.resolve(instantiatedAuthenticator);
    }

    // Check again if the class has the authenticate method
    if (typeof instantiatedAuthenticator.authenticate !== 'function') {
      throw new AuthenticatorInstantiationError("The authenticator isn't valid. It isn't a function or doesn't implement the 'authenticate' method.", instantiatedAuthenticator, authenticatorContext);
    }

    // Check again if the class has the setContext method
    if (typeof instantiatedAuthenticator.setContext !== 'function') {
      throw new AuthenticatorInstantiationError("The authenticator isn't valid. It isn't a function or doesn't implement the 'setContext' method.", instantiatedAuthenticator, authenticatorContext);
    }

    return instantiatedAuthenticator;
  }
}

