import {DependencyContainer, injectable} from "tsyringe";
import {ConfigurationDefinitionAlreadyExistsError} from "../errors/configuration-definition-already-exists.error";
import {ModuleConfigurationValue} from "../types/module-configuration.value";
import {ConfigurationParser} from "../parsers/configuration.parser";
import {ConfigurationValidationError} from "../errors/configuration-validation.error";
import {ConfigurationDefinition} from "@pristine-ts/common";
import {PristineConfigFileLoader} from "../loaders/pristine-config-file.loader";

@injectable()
export class ConfigurationManager {
  public configurationDefinitions: { [key: string]: ConfigurationDefinition } = {};

  public constructor(
    private readonly configurationParser: ConfigurationParser,
    private readonly pristineConfigFileLoader: PristineConfigFileLoader,
  ) {
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
   * Loads configuration values into the container using the precedence chain:
   *
   *   1. `moduleConfigurationValues` — explicit overrides passed to `kernel.start()`.
   *      Highest precedence; wins all conflicts.
   *   2. `pristine.config.ts:config` — values from the user-authored config file.
   *      Beats `configDefaults` and the resolver chain.
   *   3. `configDefaults` — merged from every module's `ModuleInterface.configDefaults`.
   *      Beats the resolver chain.
   *   4. `configurationDefinition.defaultResolvers` — per-key resolver list (env vars,
   *      secrets manager, etc.). First successful resolver wins.
   *   5. `configurationDefinition.defaultValue` — hard fallback.
   *
   * Conflicts:
   *   - **Same key in `moduleConfigurationValues` and the file** → stderr warning naming
   *     both sources (never the value, which may be a secret); the overrides win.
   *   - **Unknown key** in any of the explicit sources (overrides / file / configDefaults)
   *     → validation error; throws at end of `load`.
   *   - **Two modules' `configDefaults` disagree** — handled by the kernel before this
   *     method runs (throws at registration). The merged `configDefaults` reaching this
   *     method is already conflict-free.
   *
   * @param moduleConfigurationValues Explicit overrides from `kernel.start()`.
   * @param container The DI container to register resolved values into.
   * @param configDefaults Merged `ModuleInterface.configDefaults` from every module in the
   *   graph. Optional; defaults to empty.
   */
  public async load(
    moduleConfigurationValues: { [key: string]: ModuleConfigurationValue },
    container: DependencyContainer,
    configDefaults: Record<string, unknown> = {},
  ) {
    const validationErrors: string[] = [];

    const fileConfig = await this.readFileConfigSafely();

    // Build the merged "explicit value" map by precedence, lowest to highest, so each
    // later layer overwrites earlier ones. (1) configDefaults < (2) file < (3) overrides.
    const mergedValues: { [key: string]: ModuleConfigurationValue } = {};

    for (const key of Object.keys(configDefaults)) {
      mergedValues[key] = configDefaults[key] as ModuleConfigurationValue;
    }

    for (const key of Object.keys(fileConfig)) {
      mergedValues[key] = fileConfig[key] as ModuleConfigurationValue;
    }

    for (const key of Object.keys(moduleConfigurationValues)) {
      if (fileConfig.hasOwnProperty(key)) {
        // Warn (never log values — could be secrets). The overrides win regardless.
        process.stderr.write(
          `[pristine] WARNING: Configuration key '${key}' is set in BOTH:\n` +
          `  - the explicit overrides passed to kernel.start()\n` +
          `  - pristine.config.ts:config\n` +
          `Using the value from the explicit overrides. Set the key in only one place to silence this warning.\n`,
        );
      }
      mergedValues[key] = moduleConfigurationValues[key];
    }

    // Process every merged value against the registered definitions. Unknown keys land in
    // validationErrors so multiple typos surface in a single throw at the end.
    for (const key of Object.keys(mergedValues)) {
      if (this.configurationDefinitions.hasOwnProperty(key) === false) {
        validationErrors.push("There are no ConfigurationDefinition in any of the modules for the following key: '" + key + "'.");
        continue;
      }

      const resolvedConfigurationValue = await this.configurationParser.resolve(mergedValues[key], container);

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
            // We don't need to be logging a warning for a default resolver.
            //console.warn("A default resolver has thrown: " + e);
          }
        }

        if (isConfigurationResolvedByDefaultResolver) {
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
   * Returns the registered required parameters that are missing a value, without mutating state and without
   * invoking default resolvers (which would require a container and could throw). A parameter is reported as
   * missing when it is declared `isRequired: true` and no value was provided in `moduleConfigurationValues`.
   * `hasDefaultResolvers` indicates that a defaultResolver is configured and may still satisfy the value at
   * load time — call sites can use this to decide whether the missing entry should be treated as fatal.
   */
  public getMissingRequiredParameters(moduleConfigurationValues: {
    [key: string]: ModuleConfigurationValue
  }): { parameterName: string; hasDefaultResolvers: boolean }[] {
    const missing: { parameterName: string; hasDefaultResolvers: boolean }[] = [];

    for (const key of Object.keys(this.configurationDefinitions)) {
      if (this.configurationDefinitions.hasOwnProperty(key) === false) {
        continue;
      }

      const definition = this.configurationDefinitions[key];

      if (definition.isRequired !== true) {
        continue;
      }

      if (moduleConfigurationValues.hasOwnProperty(key) && moduleConfigurationValues[key] !== undefined) {
        continue;
      }

      missing.push({
        parameterName: key,
        hasDefaultResolvers: Array.isArray(definition.defaultResolvers) && definition.defaultResolvers.length > 0,
      });
    }

    return missing;
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

  /**
   * Reads the `config:` block from `pristine.config.{ts,js}` (if present). The file is
   * optional — its absence is not an error, just produces an empty map. Failures to
   * parse a present file are also swallowed (and reported via stderr) so misconfigured
   * config files don't take down the whole boot.
   */
  private async readFileConfigSafely(): Promise<Record<string, unknown>> {
    try {
      const parsed = await this.pristineConfigFileLoader.load();
      if (parsed === undefined) {
        return {};
      }
      const block = parsed.config;
      if (block === undefined || block === null) {
        return {};
      }
      if (typeof block !== "object" || Array.isArray(block)) {
        process.stderr.write(
          `[pristine] WARNING: pristine.config.ts:config is not a plain object. Ignoring file-based configuration overrides.\n`,
        );
        return {};
      }
      return block as Record<string, unknown>;
    } catch (error) {
      process.stderr.write(
        `[pristine] WARNING: Failed to load pristine.config.ts for runtime configuration: ${(error as Error).message}\n` +
        `Continuing without file-based configuration overrides.\n`,
      );
      return {};
    }
  }
}
