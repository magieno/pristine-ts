import {DependencyContainer, injectable} from "tsyringe";
import {AuthenticationManagerInterface} from "../interfaces/authentication-manager.interface";
import {IdentityInterface, RequestInterface, tag} from "@pristine-ts/common";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {GuardInterface} from "../interfaces/guard.interface";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {AuthenticatorInitializationError} from "../errors/authenticator-initialization.error";
import {LogHandler} from "@pristine-ts/logging";

@tag("AuthenticationManagerInterface")
@injectable()
export class AuthenticationManager implements AuthenticationManagerInterface {
    public constructor(private readonly logHandler: LogHandler) {
    }

    public async authenticate(request: RequestInterface, routeContext: any, container: DependencyContainer): Promise<IdentityInterface | undefined> {
        if(!routeContext || routeContext.authenticator === undefined) {
            return Promise.resolve(undefined);
        }

        let identity: IdentityInterface | undefined;

        const authenticatorContext: AuthenticatorContextInterface = routeContext.authenticator;

        try {
            const instantiatedAuthenticator: AuthenticatorInterface = this.instantiateAuthenticatorFromContext(authenticatorContext, container);

            await instantiatedAuthenticator.setContext(authenticatorContext);

            identity = await instantiatedAuthenticator.authenticate(request);
        }
        catch (e) {
            this.logHandler.error(e.message);
            identity = undefined;
        }

        return Promise.resolve(identity);
    }

    private instantiateAuthenticatorFromContext(authenticatorContext: AuthenticatorContextInterface, container: DependencyContainer): AuthenticatorInterface {
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
