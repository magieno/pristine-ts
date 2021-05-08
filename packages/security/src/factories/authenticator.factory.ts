import {DependencyContainer, injectable} from "tsyringe";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {AuthenticatorInitializationError} from "../errors/authenticator-initialization.error";

@injectable()
export class AuthenticatorFactory {
    fromContext(authenticatorContext: AuthenticatorContextInterface, container: DependencyContainer): AuthenticatorInterface {
        // Check if the guard needs to be instantiated
        let instantiatedAuthenticator: AuthenticatorInterface = authenticatorContext.authenticator as AuthenticatorInterface;

        if (typeof instantiatedAuthenticator === 'function') {
            instantiatedAuthenticator = container.resolve(instantiatedAuthenticator);
        }

        // Check again if the class has the authenticate method
        if (typeof instantiatedAuthenticator.authenticate !== 'function') {
            throw new AuthenticatorInitializationError("The authenticator: '" + instantiatedAuthenticator + "' isn't valid. It isn't a function or doesn't implement the 'authenticate' method.");
        }

        // Check again if the class has the setContext method
        if (typeof instantiatedAuthenticator.setContext !== 'function') {
            throw new AuthenticatorInitializationError("The authenticator: '" + instantiatedAuthenticator + "' isn't valid. It isn't a function or doesn't implement the 'setContext' method.");
        }

        return instantiatedAuthenticator;
    }
}

