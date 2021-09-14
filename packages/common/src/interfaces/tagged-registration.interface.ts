import {ProviderRegistration} from "../types/provider-registration.type";

/**
 * This interface defines what a tag registration needs.
 */
export interface TaggedRegistrationInterface {
    /**
     * The provider registration that provides all the information to register the service.
     */
    providerRegistration: ProviderRegistration;

    /**
     * The constructor of the service that the Tag applies to.
     */
    constructor: any;
}
