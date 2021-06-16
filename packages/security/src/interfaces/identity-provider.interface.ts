import {IdentityInterface} from "@pristine-ts/common";

export interface IdentityProviderInterface {
    provide(identity: IdentityInterface): Promise<IdentityInterface>;
}