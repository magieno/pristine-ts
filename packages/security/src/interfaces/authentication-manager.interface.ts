import {DependencyContainer} from "tsyringe";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";

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
    authenticate(request: RequestInterface, routeContext: any, container: DependencyContainer): Promise<IdentityInterface | undefined>
}
