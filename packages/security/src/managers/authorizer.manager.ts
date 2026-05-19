import {DependencyContainer, inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {TracingManagerInterface} from "@pristine-ts/telemetry";
import {IdentityInterface, moduleScoped, Request, tag, traced} from "@pristine-ts/common";
import {AuthorizerManagerInterface} from "../interfaces/authorizer-manager.interface";
import {GuardFactory} from "../factories/guard.factory";
import {SecurityModuleKeyname} from "../security.module.keyname";
import {guardMetadataKeyname} from "../decorators/guard.decorator";

/**
 * The authorizer manager provides authorization by authorizing the action.
 * It is tagged and can be injected using AuthorizerManagerInterface which facilitates mocking.
 */
@moduleScoped(SecurityModuleKeyname)
@tag("AuthorizerManagerInterface")
@injectable()
export class AuthorizerManager implements AuthorizerManagerInterface {

  /**
   * The authorizer manager provides authorization by authorizing the action.
   * @param logHandler The log handler to output logs.
   * @param tracingManager The tracing manager used to attach markers per guard decision.
   * @param guardFactory The factory to create the guard.
   */
  public constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
                     @inject("TracingManagerInterface") private readonly tracingManager: TracingManagerInterface,
                     private readonly guardFactory: GuardFactory) {
  }

  /**
   * Returns whether or not the request is authorized to access the route. Drops one marker
   * per guard (`authz.guard-decision` with the guard's class name and `allow`/`deny`/`error`)
   * so the trace shows which guard was the deciding one.
   * @param request The request to authorize.
   * @param routeContext The route context.
   * @param container The dependency container to resolve the guard from.
   * @param identity The identity making the request.
   */
  @traced()
  public async isAuthorized(request: Request, routeContext: any, container: DependencyContainer, identity?: IdentityInterface): Promise<boolean> {
    if (!routeContext || routeContext[guardMetadataKeyname] === undefined || Array.isArray(routeContext[guardMetadataKeyname]) === false) {
      this.tracingManager.addMarkerToCurrentSpan("authz.no-guards");
      return true;
    }

    const guards = routeContext[guardMetadataKeyname];

    let isAuthorized = true;

    for (const guardContext of guards) {
      let guardName = "(unknown guard)";
      try {
        const instantiatedGuard = this.guardFactory.fromContext(guardContext, container);
        guardName = instantiatedGuard.constructor.name;

        await instantiatedGuard.setContext(guardContext);

        const didAuthorize = await instantiatedGuard.isAuthorized(request, identity);
        this.tracingManager.addMarkerToCurrentSpan("authz.guard-decision", {
          guard: guardName,
          decision: didAuthorize ? "allow" : "deny",
        });
        isAuthorized = isAuthorized && didAuthorize;
      } catch (e: any) {
        this.tracingManager.addMarkerToCurrentSpan("authz.guard-decision", {
          guard: guardName,
          decision: "error",
          errorMessage: e?.message ?? "Unknown error",
        });
        this.logHandler.error("AuthorizerManager: Error while authorizing the request.", {
          highlights: {
            errorMessage: e?.message ?? "Unknown error",
            requestUrl: `${request.httpMethod} ${request.url}`,
            identityId: identity?.id ?? "No Identity Id found",
            identityClaims: identity?.claims ?? "No claims found",
          },
          extra: {
            error: e,
            request,
            identity,
          }
        });
        isAuthorized = false;
      }
    }

    this.logHandler.info(`User authorized`, {
      headlights: {isAuthorized},
      extra: {request, routeContext},
    });

    return isAuthorized;
  }
}
