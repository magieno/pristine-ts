import {DependencyContainer, inject, injectable, injectAll} from "tsyringe";
import {AuthenticationManagerInterface} from "../interfaces/authentication-manager.interface";
import {IdentityInterface, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {Breadcrumb, BreadcrumbHandlerInterface, LogHandlerInterface} from "@pristine-ts/logging";
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
        this.breadcrumbHandler.addBreadcrumb(new Breadcrumb("Authenticating request", {request, routeContext}));
        if(!routeContext || routeContext[authenticatorMetadataKeyname] === undefined) {
            this.breadcrumbHandler.addBreadcrumb(new Breadcrumb("No authenticator defined for this route.", {routeContext}));
            return undefined;
        }

        const authenticator = routeContext[authenticatorMetadataKeyname];

        let identity: IdentityInterface | undefined;

        const authenticatorContext: AuthenticatorContextInterface = authenticator;

        try {
            this.breadcrumbHandler.addBreadcrumb(new Breadcrumb("Instantiating authenticator", {authenticatorContext}));
            const instantiatedAuthenticator: AuthenticatorInterface = this.authenticatorFactory.fromContext(authenticatorContext, container);

            await instantiatedAuthenticator.setContext(authenticatorContext);

            this.breadcrumbHandler.addBreadcrumb(new Breadcrumb("Calling 'authenticate' on authenticator", {authenticator: instantiatedAuthenticator.constructor.name}));
            identity = await instantiatedAuthenticator.authenticate(request);
            this.breadcrumbHandler.addBreadcrumb(new Breadcrumb("Authenticator returned identity", {identity}));

            if(identity == undefined) {
                this.breadcrumbHandler.addBreadcrumb(new Breadcrumb("Identity is undefined, skipping identity providers.", {identity}));
                return identity;
            }

            // Loop over the identity providers
            for (const identityProvider of this.identityProviders) {
                this.breadcrumbHandler.addBreadcrumb(new Breadcrumb("Calling identity provider", {identityProvider: identityProvider.constructor.name}));
                identity = await identityProvider.provide(identity);
                this.breadcrumbHandler.addBreadcrumb(new Breadcrumb("Identity provider returned identity", {identity}));
            }

        } catch (e) {
            this.logHandler.error("AuthenticationManager: Error authenticating the request.", {extra: {error: e}}, SecurityModuleKeyname);
            this.breadcrumbHandler.addBreadcrumb(new Breadcrumb("Error authenticating the request.", {error: e}));
            throw e;
        }

        this.breadcrumbHandler.addBreadcrumb(new Breadcrumb("Finished authenticating request", {identity}));
        return identity;
    }
}
