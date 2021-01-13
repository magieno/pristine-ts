import "reflect-metadata";
import {ConfigurationParser} from "./configuration.parser";
import {ResolverInterface} from "../interfaces/resolver.interface";
import {EnvironmentVariableResolver} from "../resolvers/environment-variable.resolver";
import {ConfigurationValidationError} from "../errors/configuration-validation.error";


describe("Configuration Parser", () => {

    // Resolve
    it("should test that all the resolvers in the configuration are called", async () => {
        class TestResolver implements ResolverInterface<string>{
            resolve(): Promise<string> {
                return Promise.resolve("Test");
            }
        }
        class TestResolver2 implements ResolverInterface<string>{
            resolve(): Promise<string> {
                return Promise.resolve("Test2");
            }
        }

        const configurationParser = new ConfigurationParser();
        const configuration = await configurationParser.resolve({
            testConfigurationParameter: new TestResolver(),
            testConfigurationParameter1: "test1",
            testConfigurationParameter2: new TestResolver2(),
        });

        expect(configuration["testConfigurationParameter"]).toBe("Test");
        expect(configuration["testConfigurationParameter1"]).toBe("test1");
        expect(configuration["testConfigurationParameter2"]).toBe("Test2");
    })

    // Validate
    it("should test that if there's an array in the configuration, it throws an error", () => {
        class ConfigurationDefinitionType {
        }
        const configurationParser = new ConfigurationParser();

        expect(() => configurationParser.validateAndInterpolate(ConfigurationDefinitionType, {
            testConfigurationParameter: []
        }, "TestModule")).toThrow(new ConfigurationValidationError("The configuration element at key: 'testConfigurationParameter', for module: 'TestModule' is of type array and shouldn't be."));
    })

    it("should test that if there's an object in the configuration, it throws an error", () => {
        class ConfigurationDefinitionType {
        }
        const configurationParser = new ConfigurationParser();

        expect(() => configurationParser.validateAndInterpolate(ConfigurationDefinitionType, {
            testConfigurationParameter: {}
        }, "TestModule")).toThrow(new ConfigurationValidationError("The configuration element at key: 'testConfigurationParameter', for module: 'TestModule' is of type object and shouldn't be."));
    })

    it("should test that if there's an added key in the configuration and not in the definition, it throws an error", () => {
        class ConfigurationDefinitionType {
        }
        const configurationParser = new ConfigurationParser();

        expect(() => configurationParser.validateAndInterpolate(ConfigurationDefinitionType, {
            testConfigurationParameter: "test"
        }, "TestModule")).toThrow(new ConfigurationValidationError("The configuration element at key: 'testConfigurationParameter', for module: 'TestModule' is not listed in the ConfigurationDefinitionType and should not be passed in the configuration."));
    })

    it("should test that if there's a different type for a key in the configuration and in the definition, it throws an error", () => {
        class ConfigurationDefinitionType {
            testConfigurationParameter: number = 0;
        }
        const configurationParser = new ConfigurationParser();

        expect(() => configurationParser.validateAndInterpolate(ConfigurationDefinitionType, {
            testConfigurationParameter: "test"
        }, "TestModule")).toThrow(new ConfigurationValidationError("The configuration element at key: 'testConfigurationParameter', for module: 'TestModule' don't have the same type in the Configuration (type: 'string') versus in the ConfigurationDefinition.(type: 'number')"));
    })

    it("should pass when the configuration matches the definition", () => {
        class ConfigurationDefinitionType {
            testConfigurationParameter: number = 0;
        }
        const configurationParser = new ConfigurationParser();

        const configuration = configurationParser.validateAndInterpolate(ConfigurationDefinitionType, {
            testConfigurationParameter: 4
        }, "TestModule");

        expect(configuration["testConfigurationParameter"]).toBe(4);
    })

    it("should take the default values when the configuration doesn't define a value for optional values", () => {
        interface ConfigurationDefinition {
            testConfigurationParameter?: number;
            testConfigurationParameter2: string;
        }

        class ConfigurationDefinitionType implements ConfigurationDefinition {
            testConfigurationParameter: number = -1200;
            testConfigurationParameter2: string = "defaultValue";
        }
        const configurationParser = new ConfigurationParser();

        const configurationDefinition: ConfigurationDefinition = {
            testConfigurationParameter2: "notDefaultValue"
        }

        const configuration = configurationParser.validateAndInterpolate(ConfigurationDefinitionType, configurationDefinition, "TestModule");

        expect(configuration["testConfigurationParameter"]).toBe(-1200);
        expect(configuration["testConfigurationParameter2"]).toBe("notDefaultValue");
    })

    // Parse
    it("should properly return the injection tokens", async () => {
        interface ConfigurationDefinition {
            testConfigurationParameter?: number;
            testConfigurationParameter2: string;
        }

        class ConfigurationDefinitionType implements ConfigurationDefinition {
            testConfigurationParameter: number = -1200;
            testConfigurationParameter2: string = "defaultValue";
        }
        const configurationParser = new ConfigurationParser();

        const configurationDefinition: ConfigurationDefinition = {
            testConfigurationParameter2: "notDefaultValue"
        }

        const injectionTokens = await configurationParser.parse(ConfigurationDefinitionType, configurationDefinition, "TestModule");

        expect(injectionTokens.length).toBe(2);
        expect(injectionTokens[0].parameterName).toBe("%TestModule.testConfigurationParameter%");
        expect(injectionTokens[0].value).toBe(-1200);
        expect(injectionTokens[1].parameterName).toBe("%TestModule.testConfigurationParameter2%");
        expect(injectionTokens[1].value).toBe("notDefaultValue");
    })
});