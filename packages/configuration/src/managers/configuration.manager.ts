import {injectable, DependencyContainer, inject} from "tsyringe";
import {ConfigurationDefinitionAlreadyExistsError} from "../errors/configuration-definition-already-exists.error";
import {ModuleConfigurationValue} from "../types/module-configuration.value";
import {ConfigurationParser} from "../parsers/configuration.parser";
import {ConfigurationValidationError} from "../errors/configuration-validation.error";
import {ConfigurationDefinition} from "@pristine-ts/common";

@injectable()
export class ConfigurationManager {
    public configurationDefinitions: { [key: string]: ConfigurationDefinition } = {};

    public constructor(private readonly configurationParser: ConfigurationParser) {
    }

    /**
     * This method registers the configuration definition that a module has defined. This method will be called for each
     * configuration definition defined in each module.
     *
     * @param configurationDefinition
     */
    public register(configurationDefinition: ConfigurationDefinition) {
        if (this.configurationDefinitions.hasOwnProperty(configurationDefinition.parameterName)) {
            throw new ConfigurationDefinitionAlreadyExistsError("There is already a configuration definition registered for this parameter name.", configurationDefinition.parameterName);
        }

        this.configurationDefinitions[configurationDefinition.parameterName] = configurationDefinition;
    }

    /**
     * This method loads the configuration values passed dynamically when instantiating the Kernel. This method
     * will verify that a corresponding configurationDefinition exists and if it does, it will resolve the value.
     *
     * This method will also check to make sure that all the expected values are being passed. For example, if a module expects
     * a configuration value to be passed, this method will throw if none are passed.
     *
     * @param moduleConfigurationValues
     * @param container
     */
    public async load(moduleConfigurationValues: { [key: string]: ModuleConfigurationValue }, container: DependencyContainer) {
        const validationErrors: string[] = [];

        for (const key of Object.keys(moduleConfigurationValues)) {
            if (moduleConfigurationValues.hasOwnProperty(key) === false) {
                continue;
            }

            if (this.configurationDefinitions.hasOwnProperty(key) === false) {
                validationErrors.push("There are no ConfigurationDefinition in any of the modules for the following key: '" + key + "'.");
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
        for (const key of Object.keys(this.configurationDefinitions)) {
            if (this.configurationDefinitions.hasOwnProperty(key) === false) {
                continue;
            }

            const configurationDefinition = this.configurationDefinitions[key];

            // Start by looping over the DefaultResolvers in case one resolvers, resolves a value, else use the default value.
            if (configurationDefinition.defaultResolvers && Array.isArray(configurationDefinition.defaultResolvers)) {
                let isConfigurationResolvedByDefaultResolver = false;

                for (const defaultResolver of configurationDefinition.defaultResolvers) {
                    try {
                        const resolvedConfigurationValue = await this.configurationParser.resolve(defaultResolver, container);

                        this.registerConfigurationValue(key, resolvedConfigurationValue, container);

                        isConfigurationResolvedByDefaultResolver = true;

                        // As soon as we find a default resolver that works we stop.
                        break;
                    } catch (e) {
                        // Simply ignore and continue
                        console.warn("A default resolver has thrown: " + e);
                    }
                }

                if(isConfigurationResolvedByDefaultResolver) {
                    continue;
                }
            }

            if (configurationDefinition.isRequired === true) {
                validationErrors.push("The Configuration with key: '" + key + "' is required and must be defined.");
                continue;
            }

            const resolvedConfigurationValue = await this.configurationParser.resolve(configurationDefinition.defaultValue, container);

            // Register the configuration in the container
            this.registerConfigurationValue(key, resolvedConfigurationValue, container);
        }

        if (validationErrors.length !== 0) {
            throw new ConfigurationValidationError(validationErrors);
        }

        this.configurationDefinitions = {};
    }

    /**
     * This method simply registers the configuration parameter with the resolved value in the container.
     *
     * @param configurationKey
     * @param value
     * @param container
     */
    public registerConfigurationValue(configurationKey: string, value: boolean | number | string, container: DependencyContainer) {
        // Register the configuration in the container
        container.registerInstance("%" + configurationKey + "%", value);
    }
}
