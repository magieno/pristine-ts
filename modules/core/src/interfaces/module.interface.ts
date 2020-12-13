import {ProviderRegistration} from "../types/provider-registration.type";

export interface ModuleInterface {
    importModules?: ModuleInterface[];

    providerRegistrations?: ProviderRegistration[];

    controllers?: Function[];
}