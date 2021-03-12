import {ProviderRegistration} from "../types/provider-registration.type";

export const taggedProviderRegistrationsRegistry: ProviderRegistration[] = [];

export const tag = (tag: string) => {
    return (constructor: any) => {
        taggedProviderRegistrationsRegistry.push({
            token: tag,
            useToken: constructor,
        });
    }
}
