import {DependencyContainer, inject, injectable} from "tsyringe";
import {BreadcrumbHandlerInterface, LogHandlerInterface} from "@pristine-ts/logging";
import {IdentityInterface, moduleScoped, Request, tag} from "@pristine-ts/common";
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
   * @param guardFactory The factory to create the guard.
   * @param breadcrumbHandler
   */
  public constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
                     private readonly guardFactory: GuardFactory,
                     @inject("BreadcrumbHandlerInterface") private readonly breadcrumbHandler: BreadcrumbHandlerInterface) {
  }

  /**
   * Returns whether or not the request is authorized to access the route.
   * @param request The request to authorize.
   * @param routeContext The route context.
   * @param container The dependency container to resolve the guard from.
   * @param identity The identity making the request.
   */
  public async isAuthorized(request: Request, routeContext: any, container: DependencyContainer, identity?: IdentityInterface): Promise<boolean> {
    // If there are no guards defined, we simply return that it is authorized.
    this.breadcrumbHandler.add(request.id, `${SecurityModuleKeyname}:authorizer.manager:isAuthorized:enter`, {
      request,
      routeContext
    });

    if (!routeContext || routeContext[guardMetadataKeyname] === undefined || Array.isArray(routeContext[guardMetadataKeyname]) === false) {
      return true;
    }

    const guards = routeContext[guardMetadataKeyname];

    let isAuthorized = true;

    for (const guardContext of guards) {
      try {
        const instantiatedGuard = this.guardFactory.fromContext(guardContext, container);

        await instantiatedGuard.setContext(guardContext);

        const didAuthorize = await instantiatedGuard.isAuthorized(request, identity);
        isAuthorized = isAuthorized && didAuthorize;
      } catch (e: any) {
        this.logHandler.error("AuthorizerManager: Error while authorizing the request.", {
          highlights: {
            errorMessage: e?.message ?? "Unknown error",
            requestUrl: `${request.httpMethod} ${request.url}`,
            identityId: identity?.id ?? "No Identity Id found",
            identityClaims: identity?.claims ?? "No claims found",
          },
          eventId: request.id,
          extra: {
            error: e,
            request,
            identity,
          }
        });
        isAuthorized = false;
      }
    }

    if (isAuthorized) {
      this.logHandler.info(`User authorized`, {
        headlights: {isAuthorized},
        extra: {request, routeContext},
        eventId: request.id,
        breadcrumb: `${SecurityModuleKeyname}:authorizer.manager:isAuthorized:return`
      });
    } else {
      this.logHandler.info(`User authorized`, {
        headlights: {isAuthorized},
        extra: {request, routeContext},
        eventId: request.id,
        breadcrumb: `${SecurityModuleKeyname}:authorizer.manager:isAuthorized:return`
      });
    }

    return isAuthorized;
  }
}
