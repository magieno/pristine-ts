import {inject, injectable} from "tsyringe";
import {ControllerMethodParameterDecoratorResolverInterface} from "../interfaces/controller-method-parameter-decorator-resolver.interface";
import {IdentityInterface, moduleScoped, Request, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {ParameterDecoratorInterface} from "../interfaces/parameter-decorator.interface";
import {QueryParameterDecoratorInterface} from "../interfaces/query-parameter-decorator.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {UrlUtil} from "../utils/url.util";

/**
 * The QueryParameterDecoratorResolver resolves the value of the query parameter with the name passed to the decorator
 * of the request so that it can be injected it into the parameter of the route of the controller that was annotated
 * with the @queryParameter decorator.
 * It is tagged as an MethodParameterDecoratorResolver so it can be automatically injected with the all the other MethodParameterDecoratorResolvers.
 */
@moduleScoped(NetworkingModuleKeyname)
@tag(ServiceDefinitionTagEnum.MethodParameterDecoratorResolver)
@injectable()
export class QueryParameterDecoratorResolver implements ControllerMethodParameterDecoratorResolverInterface {
  constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
  }

  /**
   * Resolves the value of the query parameter with the specified name of the request.
   * The router than injects that value into the parameter of the controller method.
   * @param methodArgument The method argument created by the decorator including the query parameter name.
   * @param request The request
   * @param routeParameters The router parameters
   * @param identity The identity making the request
   */
  resolve(methodArgument: QueryParameterDecoratorInterface,
          request: Request,
          routeParameters: { [p: string]: string },
          identity?: IdentityInterface): Promise<any> {
    try {
      const url = UrlUtil.getUrlFromRequestWithDefaultHost(request);

      return Promise.resolve(url.searchParams.get(methodArgument.queryParameterName) ?? null);
    } catch (e) {
      this.logHandler.error("QueryParameterDecoratorResolver: There was an error resolving the query parameter.", {
        extra: {
          methodArgument,
          request,
          routeParameters,
          identity
        }
      })
      return Promise.resolve(null)
    }
  }

  /**
   * Returns whether or not the resolver support such a method argument.
   * Usually we will check the methodArgument.type field to determine if it is a supported type.
   * @param methodArgument
   */
  supports(methodArgument: ParameterDecoratorInterface): boolean {
    return methodArgument && methodArgument.hasOwnProperty("type") && methodArgument.type === "queryParameter";
  }
}
