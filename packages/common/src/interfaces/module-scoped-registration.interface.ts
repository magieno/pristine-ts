/**
 * This interface defines what ModuleScopedRegistration needs.
 */
export interface ModuleScopedRegistrationInterface {
  /**
   * The module keyname that needs to be initialized before we load the service.
   */
  moduleKeyname: string;

  /**
   * The constructor of the service that the ModuleScopedRegistration applies to.
   */
  constructor: any;
}
