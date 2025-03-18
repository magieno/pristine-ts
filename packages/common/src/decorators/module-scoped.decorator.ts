import {ModuleScopedRegistrationInterface} from "../interfaces/module-scoped-registration.interface";

export const moduleScopedServicesRegistry: {[key: string]: ModuleScopedRegistrationInterface}= {};

/**
 * This decorator is to specify that a service should only be loaded if the module is initialized.
 * @param moduleKeyname The module that needs to be initialized for the service to be loaded.
 */
export const moduleScoped = (moduleKeyname: string) => {
    return (constructor: any) => {
        moduleScopedServicesRegistry[constructor] = {
            moduleKeyname: moduleKeyname,
            constructor,
        }
    }
}
