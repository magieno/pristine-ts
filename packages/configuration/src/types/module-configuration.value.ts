import {DynamicConfigurationResolverInterface} from "@pristine-ts/common";
import {ResolverInterface} from "@pristine-ts/common";

export type ModuleConfigurationValue = boolean | number | string | DynamicConfigurationResolverInterface<any> | Promise<boolean | number | string> | ResolverInterface<string | boolean | number>;
