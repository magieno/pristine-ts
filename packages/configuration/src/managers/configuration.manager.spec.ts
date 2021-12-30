import "reflect-metadata"
import {ModuleConfigurationValue} from "../types/module-configuration.value";
import {injectable, DependencyContainer, container} from "tsyringe";
import {ConfigurationManager} from "./configuration.manager";
import {ConfigurationValidationError} from "../errors/configuration-validation.error";
import {NumberResolver} from "../resolvers/number.resolver";
import {BooleanResolver} from "../resolvers/boolean.resolver";


describe("Configuration Manager", () => {

    const getConfigurationParserMock = (value: number | boolean | string) => {
        return {
            resolve: async (moduleConfigurationValue: ModuleConfigurationValue, container: DependencyContainer): (Promise<number | boolean | string>) => {
                if(typeof moduleConfigurationValue === "boolean" || typeof moduleConfigurationValue === "number" || typeof moduleConfigurationValue === "string") {
                    return moduleConfigurationValue;
                }

                return Promise.resolve(value);
            }
        }
    }

    describe("register", () => {
        it("should register the ConfigurationDefinition", () => {})

        it("should throw an error when trying to register a ConfigurationDefinition that already exists", () => {})
    })

    describe("registerConfigurationValue", () => {
        it("should register the configuration value in the container", () => {
            const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("test"));

            configurationManager.registerConfigurationValue("configurationKey", "configurationValue", container);

            expect(container.resolve("%configurationKey%")).toBe("configurationValue");
        })
    })

    describe("load", () => {
        it("should throw an error when there are not configurationDefinition for a moduleConfigurationValue", async () => {
            const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("test"));

            await expect(configurationManager.load({
                "pristine.test.parameter": "parameterValue"
            }, container)).rejects.toThrowError(ConfigurationValidationError);
        })

        it("should throw an error when there are no moduleConfigurationValue for a 'required' configurationDefinition", async () => {
            const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("test"));

            configurationManager.register({
                parameterName: "pristine.test.parameter2",
                isRequired: true,
            });

            await expect(configurationManager.load({
            }, container)).rejects.toThrowError(ConfigurationValidationError);
        })

        it("should properly load in the container configurationDefinition that have default values and are not defined in the moduleConfigurationValue", async() => {
            const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("testResolved"));

            configurationManager.register({
                parameterName: "pristine.test.parameter3",
                isRequired: false,
                defaultValue: "defaultValue"
            });

            await configurationManager.load({}, container);

            expect(container.resolve("%pristine.test.parameter3%")).toBe("defaultValue");
        })

        it("should properly load in the container the moduleConfigurationValues", async() => {
            const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("testResolved"));

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
            const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("testResolved"));

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
            const configurationManager: ConfigurationManager = new ConfigurationManager(getConfigurationParserMock("testResolved"));
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

        it("should load the configuration in under 50ms", async() => {

        })
    })
});
