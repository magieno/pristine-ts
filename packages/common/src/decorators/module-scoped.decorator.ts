import {ModuleScopedRegistrationInterface} from "../interfaces/module-scoped-registration.interface";

export const moduleScopedServicesRegistry: {[key: string]: ModuleScopedRegistrationInterface}= {};

export const moduleScoped = (moduleKeyname: string) => {
    return (constructor: any) => {
        moduleScopedServicesRegistry[constructor] = {
            moduleKeyname: moduleKeyname,
            constructor,
        }
    }
}
