import {DynamicConfigurationResolverInterface} from "../interfaces/dynamic-configuration-resolver.interface";
import {ResolverInterface} from "../interfaces/resolver.interface";

/**
 * This type defines what a ConfigurationDefinition needs.
 */
export type ConfigurationDefinition = {
  /**
   * The name of the configuration parameter.
   */
  parameterName: string;

  /**
   * Whether the parameter is required to continue. If set to true, there cannot be a default value, and the process will throw an error if no value is provided for the parameter.
   */
  isRequired: true;

  /**
   * Default resolvers that can be provided in the module to prevent having to define a new one everytime.
   */
  defaultResolvers?: (string | boolean | number | DynamicConfigurationResolverInterface<any> | Promise<string | boolean | number> | ResolverInterface<string | boolean | number | any>)[];
} | {
  /**
   * The name of the configuration parameter.
   */
  parameterName: string;

  /**
   * Whether the parameter is required to continue. If set to false, there needs be a default value.
   */
  isRequired: false;

  /**
   * The default value if no other value is provided for that parameter.
   */
  defaultValue: string | boolean | number | DynamicConfigurationResolverInterface<any>;

  /**
   * Default resolvers that can be provided in the module to prevent having to define a new one everytime.
   */
  defaultResolvers?: (string | boolean | number | DynamicConfigurationResolverInterface<any> | Promise<string | boolean | number> | ResolverInterface<string | boolean | number | any>)[];
}
