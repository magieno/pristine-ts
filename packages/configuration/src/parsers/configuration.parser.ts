import {ConfigurationValidationError} from "../errors/configuration-validation.error";
import {injectable, DependencyContainer} from "tsyringe";
import {ModuleConfigurationValue} from "../types/module-configuration.value";

@injectable()
export class ConfigurationParser {

    async resolve(moduleConfigurationValue: ModuleConfigurationValue, container: DependencyContainer): Promise<number | boolean | string> {
        if(typeof moduleConfigurationValue === "boolean" || typeof moduleConfigurationValue === "number" || typeof moduleConfigurationValue === "string") {
            return moduleConfigurationValue;
        }

        if(typeof moduleConfigurationValue === "object") {
            if (typeof moduleConfigurationValue.dynamicResolve === "function") {
                let instantiatedClass;

                if(moduleConfigurationValue.injectionToken) {
                    instantiatedClass = container.resolve(moduleConfigurationValue.injectionToken);
                }

                return Promise.resolve(moduleConfigurationValue.dynamicResolve(instantiatedClass));
            }
        }

        throw new ConfigurationValidationError(["The configuration value passed contains an unsupported type. Unsupported type: '" + typeof moduleConfigurationValue+ "'"])
    }
}