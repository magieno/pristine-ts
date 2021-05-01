import {injectable,  injectAll} from "tsyringe";
import {IdentityInterface, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {ControllerMethodParameterDecoratorResolverInterface} from "../interfaces/controller-method-parameter-decorator-resolver.interface";
import {BodyParameterDecoratorInterface} from "../interfaces/body-parameter-decorator.interface";
import {QueryParameterDecoratorInterface} from "../interfaces/query-parameter-decorator.interface";
import {QueryParametersDecoratorInterface} from "../interfaces/query-parameters-decorator.interface";
import {RouteParameterDecoratorInterface} from "../interfaces/route-parameter-decorator.interface";
import {Request} from "../models/request";
import {IdentityParameterDecoratorInterface} from "../interfaces/identity-parameteter-decorator.interface";

@injectable()
export class ControllerMethodParameterDecoratorResolver {
    constructor(@injectAll(ServiceDefinitionTagEnum.MethodParameterDecoratorResolver) private readonly methodParameterDecoratorResolvers: ControllerMethodParameterDecoratorResolverInterface[]) {
    }

    // todo: here what happens with the decorator that are defined in other modules ?
    public resolve(methodArgument: BodyParameterDecoratorInterface | QueryParameterDecoratorInterface | QueryParametersDecoratorInterface | RouteParameterDecoratorInterface | IdentityParameterDecoratorInterface,
                   request: Request,
                   routeParameters: { [key: string]: string },
                   identity?: IdentityInterface): Promise<any> {

        for (let methodParameterDecoratorResolver of this.methodParameterDecoratorResolvers) {
            if(methodParameterDecoratorResolver.supports(methodArgument)) {
                return methodParameterDecoratorResolver.resolve(methodArgument, request, routeParameters, identity);
            }
        }

        return Promise.resolve(null);
    }
}
