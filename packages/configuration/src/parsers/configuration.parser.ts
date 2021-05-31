import {ConfigurationValidationError} from "../errors/configuration-validation.error";
import {injectable, DependencyContainer} from "tsyringe";
import {ModuleConfigurationValue} from "../types/module-configuration.value";
import {DynamicConfigurationResolverInterface} from "@pristine-ts/common";
import {ResolverInterface} from "@pristine-ts/common";

@injectable()
export class ConfigurationParser {

    async resolve(moduleConfigurationValue: ModuleConfigurationValue, container: DependencyContainer): Promise<number | boolean | string> {
        const resolvedValue = await Promise.resolve(moduleConfigurationValue)

        if(typeof resolvedValue === "boolean" || typeof resolvedValue === "number" || typeof resolvedValue === "string") {
            return resolvedValue;
        }

        if(typeof resolvedValue === "object") {
            const dynamicConfigurationResolver = (resolvedValue as DynamicConfigurationResolverInterface<any>)
            if ( dynamicConfigurationResolver.dynamicResolve !== undefined && typeof dynamicConfigurationResolver.dynamicResolve === "function") {
                let instantiatedClass;

                if(dynamicConfigurationResolver.injectionToken) {
                    instantiatedClass = container.resolve(dynamicConfigurationResolver.injectionToken);
                }

                return Promise.resolve(dynamicConfigurationResolver.dynamicResolve(instantiatedClass));
            }
            else if(typeof (resolvedValue as ResolverInterface<any>).resolve === "function") {
                return Promise.resolve((resolvedValue as ResolverInterface<any>).resolve());
            }
        }

        throw new ConfigurationValidationError(["The configuration value passed contains an unsupported type. Unsupported type: '" + typeof resolvedValue+ "'"])
    }
}