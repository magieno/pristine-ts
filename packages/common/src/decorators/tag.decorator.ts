import {ProviderRegistration} from "../types/provider-registration.type";
import {TaggedRegistrationType} from "../types/tagged-registration.type";

export const taggedProviderRegistrationsRegistry: TaggedRegistrationType[] = [];

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
