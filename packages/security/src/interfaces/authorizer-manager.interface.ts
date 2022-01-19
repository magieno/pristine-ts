import {DependencyContainer} from "tsyringe";
import {IdentityInterface} from "@pristine-ts/common";
import {Request} from "@pristine-ts/common";

export interface AuthorizerManagerInterface {
    isAuthorized(request: Request, routeContext: any, container: DependencyContainer, identity?: IdentityInterface): Promise<boolean>
}
