import {DependencyContainer, injectable} from "tsyringe";
import {AuthenticationManagerInterface} from "../interfaces/authentication-manager.interface";
import {IdentityInterface, RequestInterface, tag} from "@pristine-ts/common";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {GuardInterface} from "../interfaces/guard.interface";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {AuthenticatorInitializationError} from "../errors/authenticator-initialization.error";
import {LogHandler} from "@pristine-ts/logging";
import {AuthenticatorFactory} from "../factories/authenticator.factory";

@tag("AuthenticationManagerInterface")
@injectable()
export class AuthenticationManager implements AuthenticationManagerInterface {
    public constructor(private readonly logHandler: LogHandler, private readonly authenticatorFactory: AuthenticatorFactory) {
    }

    public async authenticate(request: RequestInterface, routeContext: any, container: DependencyContainer): Promise<IdentityInterface | undefined> {
        if(!routeContext || routeContext.authenticator === undefined) {
            return Promise.resolve(undefined);
        }

        let identity: IdentityInterface | undefined;

        const authenticatorContext: AuthenticatorContextInterface = routeContext.authenticator;

        try {
            const instantiatedAuthenticator: AuthenticatorInterface = this.authenticatorFactory.fromContext(authenticatorContext, container);

            await instantiatedAuthenticator.setContext(authenticatorContext);

            identity = await instantiatedAuthenticator.authenticate(request);
        }
        catch (e) {
            this.logHandler.error(e.message);
            identity = undefined;
        }

        return Promise.resolve(identity);
    }
}
