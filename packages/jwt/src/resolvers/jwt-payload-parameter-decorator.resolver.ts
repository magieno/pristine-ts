import "reflect-metadata"
import {inject, injectable} from "tsyringe";
import {
  ControllerMethodParameterDecoratorResolverInterface,
  ParameterDecoratorInterface
} from "@pristine-ts/networking";
import {IdentityInterface, moduleScoped, Request, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {JwtModuleKeyname} from "../jwt.module.keyname";
import {JwtManagerInterface} from "../interfaces/jwt-manager.interface";
import {JwtPayloadDecoratorInterface} from "../interfaces/jwt-payload-decorator.interface";

/**
 * The JwtPayloadParameterDecoratorResolver resolves the decoded JWT in the parameter of a route of a controller when the @jwtPayload() decorator is used.
 * It is tagged as an MethodParameterDecoratorResolver so it can be automatically injected with the all the other MethodParameterDecoratorResolvers.
 */
@moduleScoped(JwtModuleKeyname)
@tag(ServiceDefinitionTagEnum.MethodParameterDecoratorResolver)
@injectable()
export class JwtPayloadParameterDecoratorResolver implements ControllerMethodParameterDecoratorResolverInterface {

  constructor(@inject("JwtManagerInterface") private readonly jwtManager: JwtManagerInterface) {
  }

  /**
   * Resolves the decoded JWT.
   * @param methodArgument The argument of the method that needs to be resolved.
   * @param request The request being handled by the controller method.
   * @param routeParameters The parameters of the route (path parameter).
   * @param identity The identity of the user making the request.
   */
  async resolve(methodArgument: JwtPayloadDecoratorInterface,
                request: Request,
                routeParameters: { [p: string]: string },
                identity?: IdentityInterface): Promise<any> {

    // Here, we need to decrypt the header and return the decrypted jwt payload
    let payload = {};

    try {
      payload = await this.jwtManager.validateAndDecode(request);
    } catch (e) {
    }

    return payload;
  }

  /**
   * Verifies if the resolver supports this type of method argument.
   * @param methodArgument The argument of the method that needs to be resolved.
   */
  supports(methodArgument: ParameterDecoratorInterface): boolean {
    return methodArgument && methodArgument.hasOwnProperty("type") && methodArgument.type === "jwtPayload";
  }
}
