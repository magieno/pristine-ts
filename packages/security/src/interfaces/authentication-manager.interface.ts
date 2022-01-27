import {DependencyContainer} from "tsyringe";
import {IdentityInterface} from "@pristine-ts/common";
import {Request} from "@pristine-ts/common";

export interface AuthenticationManagerInterface {
    authenticate(request: Request, routeContext: any, container: DependencyContainer): Promise<IdentityInterface | undefined>
}
