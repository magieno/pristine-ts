import {ContextAwareInterface, RequestInterface} from "@pristine-ts/common";
import {IdentityInterface} from "@pristine-ts/common";
import {GuardContextInterface} from "./guard-context.interface";

/**
 * The Guard Interface defines what a guard should implement.
 * It extends the ContextAwareInterface.
 */
export interface GuardInterface extends ContextAwareInterface {
    /**
     * The keyname for the guard.
     */
    keyname: string;

    /**
     * The context for the guard to use.
     */
    guardContext?: GuardContextInterface;

    /**
     * Returns whether the guard authorizes the request to access the route or not.
     * @param request The request ot authorize.
     * @param identity The identity making the request.
     */
    isAuthorized(request: RequestInterface, identity?: IdentityInterface): Promise<boolean>;
}
