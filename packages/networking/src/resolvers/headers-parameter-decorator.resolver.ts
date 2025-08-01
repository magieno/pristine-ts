import "reflect-metadata"
import {injectable} from "tsyringe";
import {ControllerMethodParameterDecoratorResolverInterface} from "../interfaces/controller-method-parameter-decorator-resolver.interface";
import {IdentityInterface, moduleScoped, Request, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {ParameterDecoratorInterface} from "../interfaces/parameter-decorator.interface";
import {HeadersParameterDecoratorInterface} from "../interfaces/headers-parameter-decorator.interface";

/**
 * The HeadersParameterDecoratorResolver resolves the value of the headers of the request so that it can be injected it into the
 * parameter of the route of the controller that was annotated with the @headers decorator.
 * It is tagged as an MethodParameterDecoratorResolver so it can be automatically injected with the all the other MethodParameterDecoratorResolvers.
 */
@moduleScoped(NetworkingModuleKeyname)
@tag(ServiceDefinitionTagEnum.MethodParameterDecoratorResolver)
@injectable()
export class HeadersParameterDecoratorResolver implements ControllerMethodParameterDecoratorResolverInterface {

  /**
   * Resolves the value of the headers of the request.
   * The router than injects that value into the parameter of the controller method.
   * @param methodArgument The method argument created by the decorator.
   * @param request The request
   * @param routeParameters The router parameters
   * @param identity The identity making the request
   */
  resolve(methodArgument: HeadersParameterDecoratorInterface,
          request: Request,
          routeParameters: { [p: string]: string },
          identity?: IdentityInterface): Promise<any> {
    return Promise.resolve(request.headers ?? null);
  }

  /**
   * Returns whether or not the resolver support such a method argument.
   * Usually we will check the methodArgument.type field to determine if it is a supported type.
   * @param methodArgument
   */
  supports(methodArgument: ParameterDecoratorInterface): boolean {
    return methodArgument && methodArgument.hasOwnProperty("type") && methodArgument.type === "headers";
  }
}
