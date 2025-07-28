import {ConfigurationValidationError} from "../errors/configuration-validation.error";
import {DependencyContainer, injectable} from "tsyringe";
import {ModuleConfigurationValue} from "../types/module-configuration.value";
import {DynamicConfigurationResolverInterface, ResolverInterface} from "@pristine-ts/common";

@injectable()
export class ConfigurationParser {

  /**
   * This method resolves the value for the configuration value.
   * The configuration value can either be a basic type, that we return right away, a promise, a DynamicConfigurationResolverInterface or a ResolverInterface that we have to resolve.
   * @param moduleConfigurationValue
   * @param container
   */
  async resolve(moduleConfigurationValue: ModuleConfigurationValue, container: DependencyContainer): Promise<number | boolean | string> {
    // No need to check if the value is a promise. https://stackoverflow.com/a/27760489/684101
    const resolvedValue = await Promise.resolve(moduleConfigurationValue)

    // If the value is already a base type or a promise that resolves to a base type we return the value right away.
    if (typeof resolvedValue === "boolean" || typeof resolvedValue === "number" || typeof resolvedValue === "string") {
      return resolvedValue;
    }

    // If the value is an object it's either a DynamicConfigurationResolverInterface or a ResolverInterface we need to resolve the proper value.
    if (typeof resolvedValue === "object") {
      const dynamicConfigurationResolver = (resolvedValue as DynamicConfigurationResolverInterface<any>)

      //  If the object is DynamicConfigurationResolverInterface
      if (dynamicConfigurationResolver.dynamicResolve !== undefined && typeof dynamicConfigurationResolver.dynamicResolve === "function") {
        let instantiatedClass;

        // Resolve the instantiated class from the dependency container based on the injection token provided.
        if (dynamicConfigurationResolver.injectionToken) {
          instantiatedClass = container.resolve(dynamicConfigurationResolver.injectionToken);
        }

        // Execute the dynamicResolve function of the DynamicConfigurationResolverInterface with the instantiatedClass.
        return Promise.resolve(dynamicConfigurationResolver.dynamicResolve(instantiatedClass));
      }
      // If the object is a ResolverInterface, we resolve the resolver and return the value.
      else if (typeof (resolvedValue as ResolverInterface<any>).resolve === "function") {
        return Promise.resolve((resolvedValue as ResolverInterface<any>).resolve());
      }
    }

    throw new ConfigurationValidationError(["The configuration value passed contains an unsupported type. Unsupported type: '" + typeof resolvedValue + "'"])
  }
}
