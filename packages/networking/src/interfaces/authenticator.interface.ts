import {IdentityInterface} from "@pristine-ts/common";
import {RequestInterface} from "./request.interface";

export interface AuthenticatorInterface {
    authenticate(request: RequestInterface): Promise<IdentityInterface>;
}
