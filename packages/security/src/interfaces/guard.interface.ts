import {ContextAwareInterface} from "@pristine-ts/common";
import {IdentityInterface} from "@pristine-ts/common";
import {GuardContextInterface} from "./guard-context.interface";
import {Request} from "@pristine-ts/common";

export interface GuardInterface extends ContextAwareInterface {
    keyname: string;

    guardContext?: GuardContextInterface;

    isAuthorized(request: Request, identity?: IdentityInterface): Promise<boolean>;
}
