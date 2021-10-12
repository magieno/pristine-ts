import {injectable} from "tsyringe";
import {ControllerMethodParameterDecoratorResolverInterface} from "../interfaces/controller-method-parameter-decorator-resolver.interface";
import {Request} from "../models/request";
import {IdentityInterface, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import Url from 'url-parse';
import {ParameterDecoratorInterface} from "../interfaces/parameter-decorator.interface";
import {QueryParameterDecoratorInterface} from "../interfaces/query-parameter-decorator.interface";

@moduleScoped(NetworkingModuleKeyname)
@tag(ServiceDefinitionTagEnum.MethodParameterDecoratorResolver)
@injectable()
export class QueryParameterDecoratorResolver implements ControllerMethodParameterDecoratorResolverInterface {
    resolve(methodArgument: QueryParameterDecoratorInterface,
            request: Request,
            routeParameters: { [p: string]: string },
            identity?: IdentityInterface):  Promise<any> {
        const url = new Url(request.url, true);

        return Promise.resolve(url.query[methodArgument.queryParameterName] ?? null);
    }

    supports(methodArgument: ParameterDecoratorInterface): boolean {
        return methodArgument && methodArgument.hasOwnProperty("type") && methodArgument.type === "queryParameter";
    }
}
