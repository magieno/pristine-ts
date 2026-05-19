import "reflect-metadata"
import {ModuleConfigurationValue} from "../types/module-configuration.value";
import {container, DependencyContainer} from "tsyringe";
import {ConfigurationManager} from "./configuration.manager";
import {ConfigurationValidationError} from "../errors/configuration-validation.error";
import {NumberResolver} from "../resolvers/number.resolver";
import {PristineConfigFileLoader} from "../loaders/pristine-config-file.loader";


describe("Configuration Manager", () => {

  const getConfigurationParserMock = (value: number | boolean | string) => {
    return {
      resolve: async (moduleConfigurationValue: ModuleConfigurationValue, container: DependencyContainer): (Promise<number | boolean | string>) => {
        if (typeof moduleConfigurationValue === "boolean" || typeof moduleConfigurationValue === "number" || typeof moduleConfigurationValue === "string") {
          return moduleConfigurationValue;
        }

        return Promise.resolve(value);
      }
    }
  }

  // Stub loader that pretends no pristine.config.ts exists on disk. Keeps these tests
  // hermetic — they don't accidentally pick up a real config file from a parent directory
  // when the test runner happens to live inside a Pristine project.
  const getEmptyConfigFileLoader = (): PristineConfigFileLoader => ({
    load: async (): Promise<undefined> => undefined,
  } as unknown as PristineConfigFileLoader);

  describe("register", () => {
    it("should register the ConfigurationDefinition", () => {
    })

    it("should throw an error when trying to register a ConfigurationDefinition that already exists", () => {
    })
  })

  describe("getMissingRequiredParameters", () => {
    it("returns required parameters with no value provided", () => {
      const configurationManager = new ConfigurationManager(getConfigurationParserMock("test"), getEmptyConfigFileLoader());
      configurationManager.register({parameterName: "a", isRequired: true});
      configurationManager.register({parameterName: "b", isRequired: true, defaultResolvers: ["fallback"]});

      const missing = configurationManager.getMissingRequiredParameters({});

      expect(missing).toEqual([
        {parameterName: "a", hasDefaultResolvers: false},
        {parameterName: "b", hasDefaultResolvers: true},
      ]);
    });

    it("excludes required parameters that have a value provided", () => {
      const configurationManager = new ConfigurationManager(getConfigurationParserMock("test"), getEmptyConfigFileLoader());
      configurationManager.register({parameterName: "a", isRequired: true});

      expect(configurationManager.getMissingRequiredParameters({a: "value"})).toEqual([]);
    });

    it("excludes optional parameters even when no value is provided", () => {
      const configurationManager = new ConfigurationManager(getConfigurationParserMock("test"), getEmptyConfigFileLoader());
      configurationManager.register({parameterName: "a", isRequired: false, defaultValue: "x"});

      expect(configurationManager.getMissingRequiredParameters({})).toEqual([]);
    });

    it("does not mutate configurationDefinitions", () => {
      const configurationManager = new ConfigurationManager(getConfigurationParserMock("test"), getEmptyConfigFileLoader());
      configurationManager.register({parameterName: "a", isRequired: true});

      configurationManager.getMissingRequiredParameters({});

      expect(Object.keys(configurationManager.configurationDefinitions)).toEqual(["a"]);
    });
  })

  describe("registerConfigurationValue", () => {
    it("should register the configuration value in the container", () => {
      const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("test"), getEmptyConfigFileLoader());

      configurationManager.registerConfigurationValue("configurationKey", "configurationValue", container);

      expect(container.resolve("%configurationKey%")).toBe("configurationValue");
    })
  })

  describe("load", () => {
    it("should throw an error when there are not configurationDefinition for a moduleConfigurationValue", async () => {
      const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("test"), getEmptyConfigFileLoader());

      await expect(configurationManager.load({
        "pristine.test.parameter": "parameterValue"
      }, container)).rejects.toThrowError(ConfigurationValidationError);
    })

    it("should throw an error when there are no moduleConfigurationValue for a 'required' configurationDefinition", async () => {
      const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("test"), getEmptyConfigFileLoader());

      configurationManager.register({
        parameterName: "pristine.test.parameter2",
        isRequired: true,
      });

      await expect(configurationManager.load({}, container)).rejects.toThrowError(ConfigurationValidationError);
    })

    it("should properly load in the container configurationDefinition that have default values and are not defined in the moduleConfigurationValue", async () => {
      const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("testResolved"), getEmptyConfigFileLoader());

      configurationManager.register({
        parameterName: "pristine.test.parameter3",
        isRequired: false,
        defaultValue: "defaultValue"
      });

      await configurationManager.load({}, container);

      expect(container.resolve("%pristine.test.parameter3%")).toBe("defaultValue");
    })

    it("should properly load in the container the moduleConfigurationValues", async () => {
      const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("testResolved"), getEmptyConfigFileLoader());

      configurationManager.register({
        parameterName: "pristine.test.parameter1",
        isRequired: true,
      });

      configurationManager.register({
        parameterName: "pristine.test.parameter2",
        isRequired: false,
        defaultValue: "defaultValue"
      });

      await configurationManager.load({
        "pristine.test.parameter1": true
      }, container);

      expect(container.resolve("%pristine.test.parameter1%")).toBeTruthy();
      expect(container.resolve("%pristine.test.parameter2%")).toBe("defaultValue");
    })


    it("should execute the default resolvers until one resolves something when the configuration isRequired", async () => {
      const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("testResolved"), getEmptyConfigFileLoader());

      configurationManager.register({
        parameterName: "pristine.test.parameter1",
        isRequired: true,
        defaultResolvers: [
          true,
        ]
      });
      await configurationManager.load({}, container);

      expect(container.resolve("%pristine.test.parameter1%")).toBeTruthy();
    })

    it("should execute the default resolvers until one resolves something when the configuration is not required", async () => {
      const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("testResolved"), getEmptyConfigFileLoader());
      const resolver: NumberResolver = new NumberResolver(5);

      configurationManager.register({
        parameterName: "pristine.test.parameter2",
        isRequired: false,
        defaultValue: 0,
        defaultResolvers: [
          await resolver.resolve(),
        ],
      });
      await configurationManager.load({}, container);

      expect(container.resolve("%pristine.test.parameter2%")).toBe(5);
    })
  })
});
