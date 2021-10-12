import "reflect-metadata"
import {injectable} from "tsyringe";
import {ControllerMethodParameterDecoratorResolverInterface} from "../interfaces/controller-method-parameter-decorator-resolver.interface";
import {Request} from "../models/request";
import {IdentityInterface, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {ParameterDecoratorInterface} from "../interfaces/parameter-decorator.interface";
import {IdentityParameterDecoratorInterface} from "../interfaces/identity-parameteter-decorator.interface";

@moduleScoped(NetworkingModuleKeyname)
@tag(ServiceDefinitionTagEnum.MethodParameterDecoratorResolver)
@injectable()
export class IdentityParameterDecoratorResolver implements ControllerMethodParameterDecoratorResolverInterface {
    resolve(methodArgument: IdentityParameterDecoratorInterface,
            request: Request,
            routeParameters: { [p: string]: string },
            identity?: IdentityInterface): Promise<any> {
        return Promise.resolve(identity ?? null);
    }

    supports(methodArgument: ParameterDecoratorInterface): boolean {
        return methodArgument && methodArgument.hasOwnProperty("type") && methodArgument.type === "identity";
    }
}
