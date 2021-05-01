import {RequestInterface} from "./request.interface";
import {IdentityInterface} from "@pristine-ts/common";

export interface GuardInterface {
    keyname: string;
    isAuthorized(request: RequestInterface, identity?: IdentityInterface): Promise<boolean>;
}
