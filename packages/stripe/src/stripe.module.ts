import {ModuleInterface} from "@pristine-ts/common";
import {StripeModuleKeyname} from "./stripe.module.keyname";
import {NetworkingModule} from "@pristine-ts/networking";
import {LoggingModule} from "@pristine-ts/logging";

export * from './clients/clients';
export * from './enums/enums';
export * from './errors/errors';
export * from './interfaces/interfaces';
export * from './managers/managers';
export * from "./stripe.module.keyname";

export const StripeModule: ModuleInterface = {
  keyname: StripeModuleKeyname,
  configurationDefinitions: [
    /**
     * The api key to use when contacting Stripe.
     */
    {
      parameterName: StripeModuleKeyname + ".stripeApiKey",
      isRequired: true,
    }
  ],
  importModules: [
    LoggingModule,
    NetworkingModule,
  ],
}
