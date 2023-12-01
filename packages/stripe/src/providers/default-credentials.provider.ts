import {CredentialsProviderInterface} from "../interfaces/credentials-provider.interface";
import {moduleScoped, tag} from "@pristine-ts/common";
import {StripeModuleKeyname} from "../stripe.module.keyname";
import {injectable, inject} from "tsyringe";

export const DefaultCredentialsProviderUniqueName = "default_credentials_provider";

@moduleScoped(StripeModuleKeyname)
@tag("CredentialsProviderInterface")
@injectable()
export class DefaultCredentialsProvider implements CredentialsProviderInterface {

    constructor( @inject(`%${StripeModuleKeyname}.stripeApiKey%`) private readonly stripeApiKey?: string) {
    }

    getStripeApiKey(): string {
        // Check that stripeApiKey isn't equal to empty string ""

        return "";
    }

    getUniqueName(): string {
        return DefaultCredentialsProvider;
    }
}