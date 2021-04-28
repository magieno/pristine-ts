import {injectable, DependencyContainer} from "tsyringe";
import {ConfigurationDefinitionAlreadyExistsError} from "../errors/configuration-definition-already-exists.error";
import {ModuleConfigurationValue} from "../types/module-configuration.value";
import {ConfigurationParser} from "../parsers/configuration.parser";
import {ConfigurationDefinition} from "../types/configuration-definition.type";
import {ConfigurationValidationError} from "../errors/configuration-validation.error";

@injectable()
export class ConfigurationManager {
    public configurationDefinitions: {[key: string]: ConfigurationDefinition} = {};

    public constructor(private readonly configurationParser: ConfigurationParser) {
    }

    public register(configurationDefinition: ConfigurationDefinition) {
        if(this.configurationDefinitions.hasOwnProperty(configurationDefinition.parameterName)) {
            throw new ConfigurationDefinitionAlreadyExistsError("There is already a configuration definition registered for this parameter name: '" + configurationDefinition.parameterName + "'");
        }

        this.configurationDefinitions[configurationDefinition.parameterName] = configurationDefinition;
    }

    public async load(moduleConfigurationValues: {[key: string]: ModuleConfigurationValue}, container: DependencyContainer) {
        const validationErrors: string[] = [];

        for(const key of Object.keys(moduleConfigurationValues)) {
            if(moduleConfigurationValues.hasOwnProperty(key) === false) {
                continue;
            }

            if(this.configurationDefinitions.hasOwnProperty(key) === false) {
                validationErrors.push("There are no ConfigurationDefinition in any of the modules for the following key: '" + key +"'.");
                continue;
            }

            const moduleConfigurationValue = moduleConfigurationValues[key];

            const resolvedConfigurationValue = await this.configurationParser.resolve(moduleConfigurationValue, container);

            // Register the configuration in the container
            this.registerConfigurationValue(key, resolvedConfigurationValue, container);

            // Remove the configurationDefinition for the key
            delete this.configurationDefinitions[key];
        }

        // Load all the remaining configurationDefinitions into the container. For each remaining configurationDefinition, we expect
        // the isRequired property to be false and to have a default value.
        for(const key of Object.keys(this.configurationDefinitions)) {
            if(this.configurationDefinitions.hasOwnProperty(key) === false) {
                continue;
            }

            const configurationDefinition = this.configurationDefinitions[key];

            if(configurationDefinition.isRequired === true) {
                validationErrors.push("The Configuration with key: '" + key +"' is required and must be defined.");
                continue;
            }

            const resolvedConfigurationValue = await this.configurationParser.resolve(configurationDefinition.defaultValue, container);

            // Register the configuration in the container
            this.registerConfigurationValue(key, resolvedConfigurationValue, container);
        }

        if(validationErrors.length !== 0) {
            throw new ConfigurationValidationError(validationErrors);
        }

        this.configurationDefinitions = {};
    }

    public registerConfigurationValue(configurationKey: string, value: boolean | number |  string, container: DependencyContainer) {
        // Register the configuration in the container
        container.registerInstance("%" + configurationKey + "%", value);
    }
}