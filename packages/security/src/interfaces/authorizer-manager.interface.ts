import {DependencyContainer} from "tsyringe";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";

export interface AuthorizerManagerInterface {
    isAuthorized(requestI: RequestInterface, routeContext: any, container: DependencyContainer, identity?: IdentityInterface): Promise<boolean>
}
