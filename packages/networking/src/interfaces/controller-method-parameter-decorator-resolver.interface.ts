import {Request} from "../models/request";
import {IdentityInterface} from "@pristine-ts/common";
import {ParameterDecoratorInterface} from "./parameter-decorator.interface";

/**
 * This interface defines the methods that a decorator resolver for method parameter in a controller must implement.
 */
export interface ControllerMethodParameterDecoratorResolverInterface {
    /**
     * Returns whether or not the resolver support such a method argument.
     * Usually we will check the methodArgument.type field to determine if it is a supported type.
     * @param methodArgument
     */
    supports(methodArgument: ParameterDecoratorInterface): boolean;

    /**
     * Resolves the value for the decorator.
     * The router than injects that value into the parameter of the controller method.
     * @param methodArgument The information on where to retrieve the value.
     * @param request The request itself.
     * @param routeParameters The parameters and their values in the route of the controller.
     * @param identity The identity making the request
     */
    resolve(methodArgument: ParameterDecoratorInterface,
            request: Request,
            routeParameters: { [key: string]: string },
            identity?: IdentityInterface): Promise<any>;
}
