import {injectable} from "tsyringe";
import {ControllerMethodParameterDecoratorResolverInterface} from "../interfaces/controller-method-parameter-decorator-resolver.interface";
import {Request} from "@pristine-ts/common";
import {IdentityInterface, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import { URL } from 'url';
import {ParameterDecoratorInterface} from "../interfaces/parameter-decorator.interface";
import {QueryParameterDecoratorInterface} from "../interfaces/query-parameter-decorator.interface";

/**
 * The QueryParameterDecoratorResolver resolves the value of the query parameter with the name passed to the decorator
 * of the request so that it can be injected it into the parameter of the route of the controller that was annotated
 * with the @queryParameter decorator.
 * It is tagged as an MethodParameterDecoratorResolver so it can be automatically injected with the all the other MethodParameterDecoratorResolvers.
 */
@moduleScoped(NetworkingModuleKeyname)
@tag(ServiceDefinitionTagEnum.MethodParameterDecoratorResolver)
@injectable()
export class QueryParameterDecoratorResolver implements ControllerMethodParameterDecoratorResolverInterface {

    /**
     * Resolves the value of the query parameter with the specified name of the request.
     * The router than injects that value into the parameter of the controller method.
     * @param methodArgument The method argument created by the decorator including the query parameter name.
     * @param request The request
     * @param routeParameters The router parameters
     * @param identity The identity making the request
     */
    resolve(methodArgument: QueryParameterDecoratorInterface,
            request: Request,
            routeParameters: { [p: string]: string },
            identity?: IdentityInterface):  Promise<any> {
        const url = new URL(request.url);

        return Promise.resolve(url.searchParams.get(methodArgument.queryParameterName) ?? null);
    }

    /**
     * Returns whether or not the resolver support such a method argument.
     * Usually we will check the methodArgument.type field to determine if it is a supported type.
     * @param methodArgument
     */
    supports(methodArgument: ParameterDecoratorInterface): boolean {
        return methodArgument && methodArgument.hasOwnProperty("type") && methodArgument.type === "queryParameter";
    }
}
