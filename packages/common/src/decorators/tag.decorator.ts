import {ProviderRegistration} from "../types/provider-registration.type";
import {TaggedRegistrationInterface} from "../interfaces/tagged-registration.interface";

export const taggedProviderRegistrationsRegistry: TaggedRegistrationInterface[] = [];

export const tag = (tag: string) => {
    return (constructor: any) => {
        taggedProviderRegistrationsRegistry.push({
            constructor,
            providerRegistration: {
                token: tag,
                useToken: constructor,
            },
        });
    }
}
