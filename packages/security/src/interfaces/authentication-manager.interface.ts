import {DependencyContainer} from "tsyringe";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";

export interface AuthenticationManagerInterface {
    authenticate(request: RequestInterface, routeContext: any, container: DependencyContainer): Promise<IdentityInterface | undefined>
}
