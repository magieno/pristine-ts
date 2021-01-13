import {ConfigurationValidationError} from "../errors/configuration-validation.error";
import {injectable} from "tsyringe";
import {ConfigurationParameterInterface} from "../interfaces/configuration-parameter.interface";

@injectable()
export class ConfigurationParser {
    /**
     * This method resolves all the parameters, validates the structure and returns an object that can be used
     * by the kernel to inject all the configuration parameters in the Container.
     *
     * @param configurationDefinitionType
     * @param configuration
     * @param moduleKeyname
     */
    async parse(configurationDefinitionType: { new(): object }, configuration: object, moduleKeyname: string): Promise<ConfigurationParameterInterface<any>[]> {
        // Resolve all the properties of the configuration if they need to be resolved.
        await this.resolve(configuration);

        // Validate the configuration
        const interpolatedConfiguration = this.validateAndInterpolate(configurationDefinitionType, configuration, moduleKeyname);

        // Loop through all the configuration parameters and create the injection tokens that the kernel will inject in the container
        const injectionTokens: ConfigurationParameterInterface<any>[] = [];

        for (const key in interpolatedConfiguration) {
            if (interpolatedConfiguration.hasOwnProperty(key) === false) {
                continue;
            }

            injectionTokens.push({
                parameterName: "%" + moduleKeyname + "." + key + "%",
                value: interpolatedConfiguration[key],
            })
        }

        return injectionTokens;
    }

    /**
     * This method calls the configuration resolvers, if there's one, for every property and "resolves" the configuration.
     *
     * @param configuration
     */
    async resolve(configuration: object): Promise<object> {
        // For every element in configuration, if the type is an object, check if it's a Resolver. If it is, call the resolve method.
        for (const key in configuration) {
            if (configuration.hasOwnProperty(key) === false) {
                continue;
            }

            const configurationElement = configuration[key];

            if (typeof configurationElement !== "object") {
                continue;
            }

            // We use this condition to check if there's a resolve method in this object. If there isn't we continue.
            if (typeof configurationElement.resolve !== 'function') {
                continue;
            }

            configuration[key] = await configurationElement.resolve();
        }

        return configuration;
    }

    /**
     *
     * @param configurationDefinitionType
     * @param configuration
     * @param moduleKeyname
     */
    validateAndInterpolate(configurationDefinitionType: { new(): object }, configuration: object, moduleKeyname: string): object {
        // Instantiate the ConfigurationDefinitionType
        const configurationDefinition = new configurationDefinitionType();

        // Loop over properties of configuration and check if this property exists in the instance of ConfigurationDefinitionType
        for (const key in configuration) {
            if (configuration.hasOwnProperty(key) === false) {
                continue;
            }

            // If the configuration Element is an object or an array, throw an exception, this isn't supported yet. They should create a separate module to have a child configuraiton.
            const configurationElement = configuration[key];

            if (Array.isArray(configurationElement)) {
                throw new ConfigurationValidationError("The configuration element at key: '" + key + "', for module: '" + moduleKeyname + "' is of type array and shouldn't be.")
            }

            if (typeof configurationElement === "object") {
                throw new ConfigurationValidationError("The configuration element at key: '" + key + "', for module: '" + moduleKeyname + "' is of type object and shouldn't be.")
            }

            if (configurationDefinition.hasOwnProperty(key) === false) {
                // "The configuration key '" + key + "' isn't listed in the ConfigurationDefinitionType and should not be passed as a configuration.
                throw new ConfigurationValidationError("The configuration element at key: '" + key + "', for module: '" + moduleKeyname + "' is not listed in the ConfigurationDefinitionType and should not be passed in the configuration.")
            }

            // Verify that they have the same type, if they don't throw. We are assuming that the Element in the ConfigurationDefinitionType has the expected type.
            if (typeof configurationElement !== typeof configurationDefinition[key]) {
                throw new ConfigurationValidationError("The configuration element at key: '" + key + "', for module: '" + moduleKeyname + "' don't have the same type in the Configuration (type: '" + typeof configurationElement + "') versus in the ConfigurationDefinition.(type: '" + typeof configurationDefinition[key] + "')")
            }

            // If the configurationElement is valid, re-assign it over the default value.
            configurationDefinition[key] = configurationElement;
        }

        return configurationDefinition;
    }
}