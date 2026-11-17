import {ConfigurationList, ConfigurationScalar, ConfigurationValue, DynamicConfigurationResolverInterface, ResolverInterface} from "@pristine-ts/common";

/**
 * This type defines what types a ModuleConfigurationValue can be: a scalar, a list of scalars, or
 * something that resolves to one of them.
 */
export type ModuleConfigurationValue =
  ConfigurationScalar
  | ConfigurationList
  | DynamicConfigurationResolverInterface<any>
  | Promise<ConfigurationValue>
  | ResolverInterface<ConfigurationValue>;
