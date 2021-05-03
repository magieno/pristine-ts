import {RequestInterface} from "./request.interface";
import {IdentityInterface} from "@pristine-ts/common";
import {MethodRouterNode} from "../nodes/method-router.node";

export interface GuardInterface {
    keyname: string;
    isAuthorized(request: RequestInterface, methodNode: MethodRouterNode, identity?: IdentityInterface): Promise<boolean>;
}
