import {injectable, injectAll} from "tsyringe";
import {IdentityInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {ControllerMethodParameterDecoratorResolverInterface} from "../interfaces/controller-method-parameter-decorator-resolver.interface";
import {Request} from "../models/request";
import {ParameterDecoratorInterface} from "../interfaces/parameter-decorator.interface";

@injectable()
export class ControllerMethodParameterDecoratorResolver {
    constructor(@injectAll(ServiceDefinitionTagEnum.MethodParameterDecoratorResolver) private readonly methodParameterDecoratorResolvers: ControllerMethodParameterDecoratorResolverInterface[]) {
    }

    public resolve(methodArgument: ParameterDecoratorInterface,
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
