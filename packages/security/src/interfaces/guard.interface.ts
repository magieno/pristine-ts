import {ContextAwareInterface, RequestInterface} from "@pristine-ts/common";
import {IdentityInterface} from "@pristine-ts/common";
import {GuardContextInterface} from "./guard-context.interface";

export interface GuardInterface extends ContextAwareInterface {
    keyname: string;

    guardContext?: GuardContextInterface;

    isAuthorized(request: RequestInterface, identity?: IdentityInterface): Promise<boolean>;
}
