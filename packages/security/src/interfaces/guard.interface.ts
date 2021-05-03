import {ContextAwareInterface, RequestInterface} from "@pristine-ts/common";
import {IdentityInterface} from "@pristine-ts/common";

export interface GuardInterface extends ContextAwareInterface{
    keyname: string;
    isAuthorized(request: RequestInterface, identity?: IdentityInterface): Promise<boolean>;
}
