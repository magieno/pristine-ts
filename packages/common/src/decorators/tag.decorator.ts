import {TaggedRegistrationInterface} from "../interfaces/tagged-registration.interface";

export const taggedProviderRegistrationsRegistry: TaggedRegistrationInterface[] = [];

/**
 * This decorator is to specify under which tag the service should be registered in the container.
 * @param tag The tag that should be used to resolve the service.
 */
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
