import {DependencyContainer} from "tsyringe";
import {IdentityInterface} from "@pristine-ts/common";
import {Request} from "@pristine-ts/common";

/**
 * The Authentication Manager Interface defines what the authentication manager should implement.
 * It facilitates mocking.
 */
export interface AuthenticationManagerInterface {
  
    /**
     * Authenticates a request.
     * @param request The request.
     * @param routeContext The context for the route.
     * @param container The dependency container.
     * @returns { IdentityInterface | undefined } The identity making the request if available. Otherwise undefined.
     */
    authenticate(request: Request, routeContext: any, container: DependencyContainer): Promise<IdentityInterface | undefined>
}
