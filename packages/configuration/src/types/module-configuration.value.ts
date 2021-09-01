import {DynamicConfigurationResolverInterface} from "@pristine-ts/common";
import {ResolverInterface} from "@pristine-ts/common";

/**
 * This type defines what types a ModuleConfigurationValue can be.
 */
export type ModuleConfigurationValue = boolean | number | string | DynamicConfigurationResolverInterface<any> | Promise<boolean | number | string> | ResolverInterface<string | boolean | number>;
