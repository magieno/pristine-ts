import {DependencyContainer, inject, injectable} from "tsyringe";
import {AuthenticationManagerInterface} from "../interfaces/authentication-manager.interface";
import {IdentityInterface, moduleScoped, RequestInterface, tag} from "@pristine-ts/common";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {AuthenticatorFactory} from "../factories/authenticator.factory";
import {SecurityModuleKeyname} from "../security.module.keyname";

@moduleScoped(SecurityModuleKeyname)
@tag("AuthenticationManagerInterface")
@injectable()
export class AuthenticationManager implements AuthenticationManagerInterface {
    public constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
                       private readonly authenticatorFactory: AuthenticatorFactory) {
    }

    public async authenticate(request: RequestInterface, routeContext: any, container: DependencyContainer): Promise<IdentityInterface | undefined> {
        if(!routeContext || routeContext.authenticator === undefined) {
            return undefined;
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
            throw e;
        }

        return identity;
    }
}
