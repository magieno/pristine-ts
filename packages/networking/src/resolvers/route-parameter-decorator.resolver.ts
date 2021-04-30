import {injectable} from "tsyringe";
import {ControllerMethodParameterDecoratorResolverInterface} from "../interfaces/controller-method-parameter-decorator-resolver.interface";
import {Request} from "../models/request";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModule} from "../networking.module";

@moduleScoped(NetworkingModule.keyname)
@tag(ServiceDefinitionTagEnum.MethodParameterDecoratorResolver)
@injectable()
export class RouteParameterDecoratorResolver implements ControllerMethodParameterDecoratorResolverInterface {
    resolve(methodArgument: any,
            request: Request,
            routeParameters: { [p: string]: string }):  Promise<any> {
        return Promise.resolve(routeParameters[methodArgument.routeParameterName] ?? null);
    }

    supports(methodArgument: any): boolean {
        return methodArgument && methodArgument.hasOwnProperty("type") && methodArgument.type === "routeParameter";
    }
}
