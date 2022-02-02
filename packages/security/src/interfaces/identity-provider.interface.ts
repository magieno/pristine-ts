import {IdentityInterface} from "@pristine-ts/common";

/**
 * The Identity Provider Interface defines what an Identity provider should implement.
 * This is useful if you need to define your own Identity object that extends the IdentityInterface.
 * You can provide your own IdentityProvider.
 */
export interface IdentityProviderInterface {
    /**
     * Provides the identity from the base Identity that was extracted from the request.
     * @param identity The identity that was extracted from the request.
     */
    provide(identity: IdentityInterface): Promise<IdentityInterface>;
}
