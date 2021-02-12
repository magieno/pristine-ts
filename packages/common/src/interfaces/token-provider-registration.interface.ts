import {InjectionToken, RegistrationOptions, TokenProvider} from "tsyringe";

/**
 * This interface is used in the module configuration object to register services in the container using an injection token.
 * It's a simple wrapper that provides all the information necessary to register a service in the container.
 */
export interface TokenProviderRegistrationInterface<T> extends TokenProvider<T>{
    token: InjectionToken<T>;

    options?: RegistrationOptions;
}