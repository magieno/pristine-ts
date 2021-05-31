import "reflect-metadata";
import {ConfigurationParser} from "./configuration.parser";
import {container} from "tsyringe";
import {EnvironmentVariableResolver} from "../resolvers/environment-variable.resolver";
import {ConfigurationValidationError} from "../errors/configuration-validation.error";
import {DynamicConfigurationResolverInterface} from "@pristine-ts/common";


describe("Configuration Parser", () => {

    // Resolve
    it("should test that all the basic values are being returned", async () => {

        const configurationParser = new ConfigurationParser();
        expect(await configurationParser.resolve(3, container)).toBe(3);
        expect(await configurationParser.resolve(true, container)).toBe(true);
        expect(await configurationParser.resolve("string", container)).toBe("string");
    })

    it("should throw when the ModuleConfigurationValue doesn't implement the DynamicConfigurationResolverInterface interface", async () => {
        const configurationParser = new ConfigurationParser();
        await expect(configurationParser.resolve(
            {
                // @ts-ignore
                allo: () => {}
            }, container)).rejects.toThrowError(ConfigurationValidationError);
    })

    it("should call the 'resolve' method in the DynamicConfigurationResolverInterface", async () => {
        const configurationValue: DynamicConfigurationResolverInterface<any> = {
            dynamicResolve: (instance) => Promise.resolve("allo"),
        }
        const spy = jest.spyOn(configurationValue, "dynamicResolve");

        const configurationParser = new ConfigurationParser();
        const resolvedValue = await configurationParser.resolve(configurationValue, container);

        expect(spy).toHaveBeenCalled();
        expect(resolvedValue).toBe("allo");
    })

    it("should pass the properly injected class coming from the container to the 'resolve' method in the DynamicConfigurationResolverInterface", async () => {
        const configurationValue: DynamicConfigurationResolverInterface<any> = {
            dynamicResolve: (instance) => Promise.resolve(instance.testclassProperty),
            injectionToken: "test"
        }
        const spy = jest.spyOn(configurationValue, "dynamicResolve");

        const test = {
            "testclassProperty": "property",
            "really": true,
        }

        container.registerInstance("test", test);

        const configurationParser = new ConfigurationParser();
        const resolvedValue = await configurationParser.resolve(configurationValue, container);

        expect(spy).toHaveBeenCalledWith(test);
        expect(resolvedValue).toBe("property");
    })

    it("should execute the default resolvers until one resolves something when the configuration isRequired", () => {

    })

    it("should execute the default resolvers until one resolves something when the configuration is not required", () => {

    })
});
