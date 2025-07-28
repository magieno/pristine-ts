import {ClassProvider, InjectionToken} from "tsyringe";

/**
 * This interface is used in the module configuration object to register services in the container using an injection token.
 * It's a simple wrapper that provides all the information necessary to register a service in the container.
 */
export interface ClassProviderRegistrationInterface<T> extends ClassProvider<T> {
  /**
   * The token to use when registering the service
   */
  token: InjectionToken<T>;

  /**
   * The constructor of the class to use.
   */
  useClass: {
    new(...args: any[]): T;
  }
}
