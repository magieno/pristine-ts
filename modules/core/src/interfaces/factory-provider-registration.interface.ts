import {FactoryProvider, InjectionToken} from "tsyringe";

/**
 * This interface is used in the module configuration object to register services in the container using a Factory.
 * It's a simple wrapper that provides all the information necessary to register a service in the container.
 */
export interface FactoryProviderRegistrationInterface<T> extends FactoryProvider<T> {
    token: InjectionToken<T>;
}