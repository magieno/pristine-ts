import {DynamicConfigurationResolverInterface} from "../interfaces/dynamic-configuration-resolver.interface";
import {ResolverInterface} from "../interfaces/resolver.interface";

export type ConfigurationDefinition = {
    parameterName: string;

    isRequired: true;

    defaultResolvers?:  (string | boolean | number | DynamicConfigurationResolverInterface<any> | Promise<string | boolean | number> | ResolverInterface<string | boolean | number>)[];
} | {
    parameterName: string;

    isRequired: false;

    defaultValue:  string | boolean | number | DynamicConfigurationResolverInterface<any>;

    defaultResolvers?:  (string | boolean | number | DynamicConfigurationResolverInterface<any> | Promise<string | boolean | number> | ResolverInterface<string | boolean | number>)[];
}
