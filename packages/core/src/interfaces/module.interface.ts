import {ProviderRegistration} from "../types/provider-registration.type";

/**
 * The ModuleInterface is the entry point that groups all the classes that you want to handle in your module.
 * We decompose the code in Modules and the packages are initialized in the Kernel.
 */
export interface ModuleInterface {
    /**
     * This is a unique keyname that uniquely identifies the module.
     */
    keyname: string;

    /**
     * TypeScript needs to have a reference to the classes in order to use them. Therefore, we provide this array
     * where you can list all your services (managers, repositories, controllers, etc..) so that they are accessible.
     */
    importServices: Function[];

    /**
     * The packages to import before to initialize this module. This module might need other packages to be initialized
     * before being able to initialize itself.
     */
    importModules?: ModuleInterface[];

    /**
     * This property allows you to custom register specific services. For example, you can assign a tag or use a factory
     * to instantiate a specific class.
     */
    providerRegistrations?: ProviderRegistration[];

    /**
     * This property defines the configuration definition that allows the kernel to know if the provided configuration is sufficient
     * for the module.
     */
    configurationDefinition?: { new(): object };
}