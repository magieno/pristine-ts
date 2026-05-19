import {DependencyContainer, inject, injectable, injectAll} from "tsyringe";
import {AuthenticationManagerInterface} from "../interfaces/authentication-manager.interface";
import {IdentityInterface, moduleScoped, Request, ServiceDefinitionTagEnum, tag, traced} from "@pristine-ts/common";
import {AuthenticatorInterface} from "../interfaces/authenticator.interface";
import {AuthenticatorContextInterface} from "../interfaces/authenticator-context.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {TracingManagerInterface} from "@pristine-ts/telemetry";
import {AuthenticatorFactory} from "../factories/authenticator.factory";
import {SecurityModuleKeyname} from "../security.module.keyname";
import {IdentityProviderInterface} from "../interfaces/identity-provider.interface";
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
   * @param tracingManager The tracing manager used to attach markers and per-provider spans to the active trace.
   * @param authenticatorFactory The factory to create the authenticator.
   */
  public constructor(
    @injectAll(ServiceDefinitionTagEnum.IdentityProvider, {isOptional: true}) private readonly identityProviders: IdentityProviderInterface[],
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @inject("TracingManagerInterface") private readonly tracingManager: TracingManagerInterface,
    private readonly authenticatorFactory: AuthenticatorFactory) {
  }

  /**
   * Authenticates a request by providing the identity that made the request.
   * Drops markers at each decision point — "no authenticator for this route," "authenticator
   * resolved to X," "identity returned by authenticator," "identity enriched by provider Y" —
   * so the trace tells the auth story without anyone having to read interleaved logs.
   * @param request The request to authenticate
   * @param routeContext The context associated with the route.
   * @param container The dependency container from which to resolve the authenticator.
   */
  @traced()
  public async authenticate(request: Request, routeContext: any, container: DependencyContainer): Promise<IdentityInterface | undefined> {
    if (!routeContext || routeContext[authenticatorMetadataKeyname] === undefined) {
      this.tracingManager.addMarkerToCurrentSpan("auth.no-authenticator");
      return undefined;
    }

    const authenticator = routeContext[authenticatorMetadataKeyname];

    let identity: IdentityInterface | undefined;

    const authenticatorContext: AuthenticatorContextInterface = authenticator;

    try {
      const instantiatedAuthenticator: AuthenticatorInterface = this.authenticatorFactory.fromContext(authenticatorContext, container);

      await instantiatedAuthenticator.setContext(authenticatorContext);

      this.tracingManager.addMarkerToCurrentSpan("auth.authenticator-resolved", {
        authenticator: instantiatedAuthenticator.constructor.name,
      });

      identity = await instantiatedAuthenticator.authenticate(request);

      if (identity == undefined) {
        this.tracingManager.addMarkerToCurrentSpan("auth.identity-not-found", {
          authenticator: instantiatedAuthenticator.constructor.name,
        });
        return identity;
      }

      this.tracingManager.addMarkerToCurrentSpan("auth.identity-resolved", {
        authenticator: instantiatedAuthenticator.constructor.name,
        identityId: identity.id ?? "(no id)",
      });

      // Loop over the identity providers, wrapping each call in its own span so per-provider
      // latency (often DB / external lookups to enrich the identity) is visible in the trace
      // tree alongside the authenticator's own span.
      for (const identityProvider of this.identityProviders) {
        const providerSpan = this.tracingManager.startSpan(`identity-provider.${identityProvider.constructor.name}`);
        try {
          identity = await identityProvider.provide(identity);
        } finally {
          providerSpan.end();
        }
      }

    } catch (e: any) {
      this.tracingManager.addMarkerToCurrentSpan("auth.error", {
        errorName: e?.name ?? "Error",
        errorMessage: e?.message ?? "Unknown error",
      });
      this.logHandler.error("AuthenticationManager: Error authenticating the request.", {
        extra: {error: e}
      });
      throw e;
    }

    this.logHandler.info(`User successfully authenticated.`, {
      highlights: {
        identity,
      },
      extra: {
        request,
        routeContext,
      },
    })
    return identity;
  }
}
