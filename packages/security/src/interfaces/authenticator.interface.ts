import {IdentityInterface} from "@pristine-ts/common";
import {ContextAwareInterface} from "@pristine-ts/common";
import {Request} from "@pristine-ts/common";

export interface AuthenticatorInterface extends ContextAwareInterface {
    authenticate(request: Request): Promise<IdentityInterface | undefined>;
}
