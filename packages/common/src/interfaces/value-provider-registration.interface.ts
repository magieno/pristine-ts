import {InjectionToken, ValueProvider} from "tsyringe";

/**
 * This interface is used in the module configuration object to register services in the container using an injection token and a value.
 * It's a simple wrapper that provides all the information necessary to register a service in the container.
 */
export interface ValueProviderRegistrationInterface<T> extends ValueProvider<T> {
    token: InjectionToken<T>;
}