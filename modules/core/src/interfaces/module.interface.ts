import {ProviderRegistration} from "../types/provider-registration.type";

/**
 * The ModuleInterface is the entry point that groups all the classes that you want to handle in your module.
 * We decompose the code in Modules and the modules are initialized in the Kernel.
 */
export interface ModuleInterface {
    /**
     * TypeScript needs to have a reference to the classes in order to use them. Therefore, we provide this array
     * where you can list all your services (managers, repositories, controllers, etc..) so that they are accessible.
     */
    importServices: Function[];

    /**
     * The modules to import before to initialize this module. This module might need other modules to be initialized
     * before being able to initialize itself.
     */
    importModules?: ModuleInterface[];

    /**
     * This property allows you to custom register specific services. For example, you can assign a tag or use a factory
     * to instantiate a specific class.
     */
    providerRegistrations?: ProviderRegistration[];
}