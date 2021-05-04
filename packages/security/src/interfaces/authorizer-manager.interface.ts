import {DependencyContainer, injectable} from "tsyringe";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";

export interface AuthorizerManagerInterface {
    isAuthorized(requestInterface: RequestInterface, routeContext: any, container: DependencyContainer, identity?: IdentityInterface): Promise<boolean>
}
