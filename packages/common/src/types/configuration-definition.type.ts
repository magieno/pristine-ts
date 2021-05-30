import {DynamicConfigurationResolverInterface} from "../interfaces/dynamic-configuration-resolver.interface";
import {ModuleConfigurationValue} from "@pristine-ts/configuration";

export type ConfigurationDefinition = {
    parameterName: string;

    isRequired: true;
} | {
    parameterName: string;

    isRequired: false;

    defaultValue: ModuleConfigurationValue;

    defaultResolvers?: ModuleConfigurationValue[];
}
