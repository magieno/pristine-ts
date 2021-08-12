import {ValueProviderRegistrationInterface} from "../interfaces/value-provider-registration.interface";
import {FactoryProviderRegistrationInterface} from "../interfaces/factory-provider-registration.interface";
import {TokenProviderRegistrationInterface} from "../interfaces/token-provider-registration.interface";

/**
 * This type regroups all the different interfaces for provider a registration for a service.
 */
export type ProviderRegistration<T = any> = FactoryProviderRegistrationInterface<T> |
    TokenProviderRegistrationInterface<T> |
    ValueProviderRegistrationInterface<T>;
