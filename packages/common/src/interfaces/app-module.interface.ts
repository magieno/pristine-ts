import {ModuleInterface} from "./module.interface";

/**
 * The AppModule Interface is the entry point that should be used to init the kernel for your application. You
 * can always init the kernel with a simple ModuleInterface but it's recommended for applications to use
 * this AppModuleInterface.
 */
export interface AppModuleInterface extends ModuleInterface {
    /**
     * TypeScript needs to have a reference to the classes in order to use them. Therefore, we provide this array
     * where you can list all your services (managers, repositories, controllers, etc..) so that they are accessible.
     */
    importServices: Function[];

    /**
     * The packages to import before to initialize this module. This module might need other packages to be initialized
     * before being able to initialize itself.
     */
    importModules: ModuleInterface[];
}
