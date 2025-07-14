import {DependencyContainer, inject, injectable, injectAll} from "tsyringe";
import {AuthenticationManagerInterface} from "../interfaces/authentication-manager.interface";
import {IdentityInterface, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {BreadcrumbHandlerInterface, LogHandlerInterface} from "@pristine-ts/logging";
import {AuthenticatorFactory} from "../factories/authenticator.factory";
import {SecurityModuleKeyname} from "../security.module.keyname";
import {IdentityProviderInterface} from "../interfaces/identity-provider.interface";
import {Request} from "@pristine-ts/common";
import {authenticatorMetadataKeyname} from "../decorators/authenticator.decorator";

/**
 * The authentication manager provides authentication by returning the identity executing the action.
 * It is tagged and can be injected using AuthenticationManagerInterface which facilitates mocking.
 */
@moduleScoped(SecurityModuleKeyname)
@tag("AuthenticationManagerInterface")
@injectable()
export class AuthenticationManager implements AuthenticationManagerInterface {

    /**
     * The authentication manager provides authentication by returning the identity executing the action.
     * @param identityProviders The identity providers to use to provide the identity. All services tagged with ServiceDefinitionTagEnum.IdentityProvider will be injected here.
     * @param logHandler The log handler to output logs.
     * @param authenticatorFactory The factory to create the authenticator.
     */
    public constructor(
        @injectAll(ServiceDefinitionTagEnum.IdentityProvider) private readonly identityProviders: IdentityProviderInterface[],
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
                       private readonly authenticatorFactory: AuthenticatorFactory,
        @inject("BreadcrumbHandlerInterface") private readonly breadcrumbHandler: BreadcrumbHandlerInterface) {
    }

    /**
     * Authenticates a request by providing the identity that made the request.
     * @param request The request to authenticate
     * @param routeContext The context associated with the route.
     * @param container The dependency container from which to resolve the authenticator.
     */
    public async authenticate(request: Request, routeContext: any, container: DependencyContainer): Promise<IdentityInterface | undefined> {
        this.breadcrumbHandler.add(request.id, `${SecurityModuleKeyname}:authentication.manager:authenticate:enter`, {request, routeContext});
        if(!routeContext || routeContext[authenticatorMetadataKeyname] === undefined) {
            return undefined;
        }

        const authenticator = routeContext[authenticatorMetadataKeyname];

        let identity: IdentityInterface | undefined;

        const authenticatorContext: AuthenticatorContextInterface = authenticator;

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

        } catch (e) {
            this.logHandler.error("AuthenticationManager: Error authenticating the request.", {extra: {error: e}});
            throw e;
        }

        this.logHandler.info(`User successfully authenticated.`, {
          highlights: {
            identity,
          },
          breadcrumb: `${SecurityModuleKeyname}:authentication.manager:authenticate:return`,
          eventId: request.id,
          extra: {
            request,
            routeContext,
          },
        })
        return identity;
    }
}
