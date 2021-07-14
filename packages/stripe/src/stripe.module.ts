import {ModuleInterface} from "@pristine-ts/common";
import {StripeModuleKeyname} from "./stripe.module.keyname";

export * from './clients/clients';
export * from './enums/enums';
export * from './errors/errors';
export * from './interfaces/interfaces';
export * from './managers/managers';
export * from "./stripe.module.keyname";

export const StripeModule: ModuleInterface = {
    keyname: StripeModuleKeyname,
    configurationDefinitions: [
        {
            parameterName: StripeModuleKeyname + ".stripeApiKey",
            isRequired: true,
        },
        {
            parameterName: StripeModuleKeyname + ".stripeEndpointSecret",
            isRequired: true
        }
    ],
    importModules: [],
}
