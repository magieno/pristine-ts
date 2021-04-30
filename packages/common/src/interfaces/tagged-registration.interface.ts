import {ProviderRegistration} from "../types/provider-registration.type";

export interface TaggedRegistrationInterface {
    providerRegistration: ProviderRegistration;
    constructor: any;
}