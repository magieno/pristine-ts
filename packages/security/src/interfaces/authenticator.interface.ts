import {IdentityInterface} from "@pristine-ts/common";
import {ContextAwareInterface} from "@pristine-ts/common";
import {RequestInterface} from "@pristine-ts/common";

export interface AuthenticatorInterface extends ContextAwareInterface {
    authenticate(request: RequestInterface): Promise<IdentityInterface | undefined>;
}
