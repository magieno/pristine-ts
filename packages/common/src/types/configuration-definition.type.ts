import {DynamicConfigurationResolverInterface} from "../interfaces/dynamic-configuration-resolver.interface";

export type ConfigurationDefinition = {
    parameterName: string;

    isRequired: true;

    defaultResolvers?:  (string | boolean | number | DynamicConfigurationResolverInterface<any>)[];
} | {
    parameterName: string;

    isRequired: false;

    defaultValue:  string | boolean | number | DynamicConfigurationResolverInterface<any>;

    defaultResolvers?:  (string | boolean | number | DynamicConfigurationResolverInterface<any>)[];
}
