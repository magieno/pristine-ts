import {InjectionToken} from "tsyringe";

/**
 * This interface specifies what a DynamicConfigurationResolver should look like.
 * A DynamicConfigurationResolver is used in configurations when you need an initialized instance of a service to resolve the value of the configuration.
 * Beware that the service resolved by the injectionToken needs to be registered in the dependency container before.
 */
export interface DynamicConfigurationResolverInterface<T> {
    /**
     * The injection token for the service that needs to be resolved
     */
    injectionToken?: InjectionToken;

    /**
     * The function that needs to be executed to resolve the value for the configuration.
     * @param injectedInstance The initialized instance of the service resolved with the injection token.
     */
    dynamicResolve: (injectedInstance?: T) => Promise<string | number | boolean | any>;
}
