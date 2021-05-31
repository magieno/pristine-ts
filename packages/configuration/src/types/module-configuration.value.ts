import {DynamicConfigurationResolverInterface} from "@pristine-ts/common";
import {ResolverInterface} from "@pristine-ts/common/dist/lib/esm/interfaces/resolver.interface";

export type ModuleConfigurationValue = boolean | number | string | DynamicConfigurationResolverInterface<any> | Promise<boolean | number | string> | ResolverInterface<string | boolean | number>;
