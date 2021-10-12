import "reflect-metadata"
import {injectable} from "tsyringe";
import {ControllerMethodParameterDecoratorResolverInterface} from "../interfaces/controller-method-parameter-decorator-resolver.interface";
import {Request} from "../models/request";
import {IdentityInterface, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {ParameterDecoratorInterface} from "../interfaces/parameter-decorator.interface";
import {BodyParameterDecoratorInterface} from "../interfaces/body-parameter-decorator.interface";

@moduleScoped(NetworkingModuleKeyname)
@tag(ServiceDefinitionTagEnum.MethodParameterDecoratorResolver)
@injectable()
export class BodyParameterDecoratorResolver implements ControllerMethodParameterDecoratorResolverInterface {
    resolve(methodArgument: BodyParameterDecoratorInterface,
            request: Request,
            routeParameters: { [p: string]: string },
            identity?: IdentityInterface): Promise<any> {
        return Promise.resolve(request.body ?? null);
    }

    supports(methodArgument: ParameterDecoratorInterface): boolean {
        return methodArgument && methodArgument.hasOwnProperty("type") && methodArgument.type === "body";
    }
}
