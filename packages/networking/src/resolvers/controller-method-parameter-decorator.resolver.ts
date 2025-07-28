import {injectable, injectAll} from "tsyringe";
import {IdentityInterface, Request, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {ControllerMethodParameterDecoratorResolverInterface} from "../interfaces/controller-method-parameter-decorator-resolver.interface";
import {ParameterDecoratorInterface} from "../interfaces/parameter-decorator.interface";

/**
 * This service calls the resolvers to resolve the value to be injected in the parameter of a method.
 */
@injectable()
export class ControllerMethodParameterDecoratorResolver {
  /**
   * This service calls the resolvers to resolve the value to be injected in the parameter of a method.
   * @param methodParameterDecoratorResolvers The parameter decorator resolvers. All services with the tag ServiceDefinitionTagEnum.MethodParameterDecoratorResolver will be automatically injected here.
   */
  constructor(@injectAll(ServiceDefinitionTagEnum.MethodParameterDecoratorResolver) private readonly methodParameterDecoratorResolvers: ControllerMethodParameterDecoratorResolverInterface[]) {
  }


  /**
   * This method calls the parameter decorator resolver that supports the type of the decorator and resolves the value to be injected in the parameter.
   * @param methodArgument The method argument created by the decorator.
   * @param request The request
   * @param routeParameters The router parameters
   * @param identity The identity making the request
   */
  public resolve(methodArgument: ParameterDecoratorInterface,
                 request: Request,
                 routeParameters: { [key: string]: string },
                 identity?: IdentityInterface): Promise<any> {

    for (const methodParameterDecoratorResolver of this.methodParameterDecoratorResolvers) {
      if (methodParameterDecoratorResolver.supports(methodArgument)) {
        return methodParameterDecoratorResolver.resolve(methodArgument, request, routeParameters, identity);
      }
    }

    return Promise.resolve(null);
  }
}
