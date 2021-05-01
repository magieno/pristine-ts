import {Request} from "../models/request";
import {IdentityInterface} from "@pristine-ts/common";

export interface ControllerMethodParameterDecoratorResolverInterface {
    supports(methodArgument: any): boolean;

    resolve(methodArgument: any,
            request: Request,
            routeParameters: { [key: string]: string },
            identity?: IdentityInterface): Promise<any>;
}
