import {injectable,  injectAll} from "tsyringe";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {ControllerMethodParameterDecoratorResolverInterface} from "../interfaces/controller-method-parameter-decorator-resolver.interface";
import {BodyParameterDecoratorInterface} from "../interfaces/body-parameteter-decorator.interface";
import {QueryParameterDecoratorInterface} from "../interfaces/query-parameter-decorator.interface";
import {QueryParametersDecoratorInterface} from "../interfaces/query-parameters-decorator.interface";
import {RouteParameterDecoratorInterface} from "../interfaces/route-parameter-decorator.interface";
import {Request} from "../models/request";

@injectable()
export class ControllerMethodParameterDecoratorResolver {
    constructor(@injectAll(ServiceDefinitionTagEnum.MethodParameterDecoratorResolver) private readonly methodParameterDecoratorResolvers: ControllerMethodParameterDecoratorResolverInterface[]) {
    }

    public resolve(methodArgument: BodyParameterDecoratorInterface | QueryParameterDecoratorInterface | QueryParametersDecoratorInterface | RouteParameterDecoratorInterface,
                   request: Request,
                   routeParameters: { [key: string]: string }): Promise<any> {

        for (let methodParameterDecoratorResolver of this.methodParameterDecoratorResolvers) {
            if(methodParameterDecoratorResolver.supports(methodArgument)) {
                return methodParameterDecoratorResolver.resolve(methodArgument, request, routeParameters);
            }
        }

        return Promise.resolve(null);
    }
}
