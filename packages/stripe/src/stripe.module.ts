import {ModuleInterface} from "@pristine-ts/common";
import {StripeModuleKeyname} from "./stripe.module.keyname";
import {NetworkingModule} from "@pristine-ts/networking";
import {DefaultCredentialsProviderUniqueName} from "./providers/default-credentials.provider";

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
            isRequired: false,
            defaultValue: ""
        },
        /**
         * The name of the credential provider to use.
         */
        {
            parameterName: StripeModuleKeyname + ".credential_provider.name",
            isRequired: false,
            defaultValue: DefaultCredentialsProviderUniqueName
        }
    ],
    importModules: [
        NetworkingModule,
    ],
}
