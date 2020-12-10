import {ValueProviderRegistrationInterface} from "../interfaces/value-provider-registration.interface";
import {FactoryProviderRegistrationInterface} from "../interfaces/factory-provider-registration.interface";
import {TokenProviderRegistrationInterface} from "../interfaces/token-provider-registration.interface";

export type ProviderRegistration<T = any> = FactoryProviderRegistrationInterface<T> |
    TokenProviderRegistrationInterface<T> |
    ValueProviderRegistrationInterface<T>;