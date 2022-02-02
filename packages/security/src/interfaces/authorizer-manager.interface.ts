import {DependencyContainer} from "tsyringe";
import {IdentityInterface} from "@pristine-ts/common";
import {Request} from "@pristine-ts/common";

/**
 * The Authentication Manager Interface defines what the authentication manager should implement.
 * It facilitates mocking.
 */
export interface AuthorizerManagerInterface {

    /**
     * Returns whether or not the request is authorized to access the route.
     * @param request The request.
     * @param routeContext The context associated with the route.
     * @param container The dependency container.
     * @param identity The identity making the request.
     */
    isAuthorized(request: Request, routeContext: any, container: DependencyContainer, identity?: IdentityInterface): Promise<boolean>
}
