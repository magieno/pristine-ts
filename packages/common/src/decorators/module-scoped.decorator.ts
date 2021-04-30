import {ModuleScopedRegistrationType} from "../types/module-scoped-registration.type";

export const moduleScopedServicesRegistry: {[key: string]: ModuleScopedRegistrationType}= {};

export const moduleScoped = (moduleKeyname: string) => {
    return (constructor: any) => {
        moduleScopedServicesRegistry[constructor] = {
            moduleKeyname: moduleKeyname,
            constructor,
        }
    }
}
