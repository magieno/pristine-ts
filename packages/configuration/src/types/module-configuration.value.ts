import {DynamicConfigurationResolverInterface} from "../interfaces/dynamic-configuration-resolver.interface";

export type ModuleConfigurationValue = boolean | number | string | DynamicConfigurationResolverInterface<any>;