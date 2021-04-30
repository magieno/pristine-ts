import {DynamicConfigurationResolverInterface} from "../interfaces/dynamic-configuration-resolver.interface";

export type ConfigurationDefinition = {
    parameterName: string;

    isRequired: true;
} | {
    parameterName: string;

    isRequired: false;
    defaultValue: string | boolean | number | DynamicConfigurationResolverInterface<any>;
}