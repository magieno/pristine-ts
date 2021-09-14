import {DependencyContainer, inject, injectable, injectAll} from "tsyringe";
import {AuthenticationManagerInterface} from "../interfaces/authentication-manager.interface";
import {IdentityInterface, moduleScoped, RequestInterface, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {AuthenticatorFactory} from "../factories/authenticator.factory";
import {SecurityModuleKeyname} from "../security.module.keyname";
import {IdentityProviderInterface} from "../interfaces/identity-provider.interface";

@moduleScoped(SecurityModuleKeyname)
@tag("AuthenticationManagerInterface")
@injectable()
export class AuthenticationManager implements AuthenticationManagerInterface {
    public constructor(
        @injectAll(ServiceDefinitionTagEnum.IdentityProvider) private readonly identityProviders: IdentityProviderInterface[],
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
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

            if(identity == undefined) {
                return identity;
            }

            // Loop over the identity providers
            for (const identityProvider of this.identityProviders) {
                identity = await identityProvider.provide(identity);
            }

        }
        catch (e) {
            this.logHandler.error(e.message, {e}, SecurityModuleKeyname);
            identity = undefined;
            throw e;
        }

        return identity;
    }
}
