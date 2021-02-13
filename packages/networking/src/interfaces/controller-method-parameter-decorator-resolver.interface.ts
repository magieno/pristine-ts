import {Request} from "../models/request";

export interface ControllerMethodParameterDecoratorResolverInterface {
    supports(methodArgument: any): boolean;

    resolve(methodArgument: any,
            request: Request,
            routeParameters: { [key: string]: string }): Promise<any>;
}