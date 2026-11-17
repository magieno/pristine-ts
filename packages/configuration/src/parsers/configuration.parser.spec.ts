import "reflect-metadata";
import {ConfigurationParser} from "./configuration.parser";
import {container} from "tsyringe";
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

  it("should return a list of basic values, as a frozen copy", async () => {
    const configurationParser = new ConfigurationParser();
    const list = ["a", 2, true];

    const resolved = await configurationParser.resolve(list, container);

    expect(resolved).toEqual(["a", 2, true]);
    expect(resolved).not.toBe(list);
    expect(Object.isFrozen(resolved)).toBe(true);
    // The list of the caller is not frozen and not changed.
    expect(Object.isFrozen(list)).toBe(false);
    expect(await configurationParser.resolve([], container)).toEqual([]);
    expect(await configurationParser.resolve(Promise.resolve(["a", "b"]), container)).toEqual(["a", "b"]);
  })

  it("should refuse a list that holds something else than a basic value, and say where", async () => {
    const configurationParser = new ConfigurationParser();

    // @ts-ignore
    await expect(configurationParser.resolve(["a", ["b"]], container)).rejects.toThrowError(ConfigurationValidationError);
    // @ts-ignore
    await expect(configurationParser.resolve(["a", {b: 1}], container)).rejects.toThrowError(ConfigurationValidationError);
    // @ts-ignore
    await expect(configurationParser.resolve(["a", null], container)).rejects.toThrowError(ConfigurationValidationError);
    // @ts-ignore
    await expect(configurationParser.resolve([undefined], container)).rejects.toThrowError(ConfigurationValidationError);

    // @ts-ignore
    const error: ConfigurationValidationError = await configurationParser.resolve(["a", "b", ["c"]], container).catch(e => e);
    expect(error.message).toContain("position 2");
    expect(error.message).toContain("'array'");
  })

  it("should freeze the list that a resolver or a dynamic resolver gives", async () => {
    const configurationParser = new ConfigurationParser();
    const fromResolver = await configurationParser.resolve({resolve: async () => ["a", "b"]}, container);
    const fromDynamicResolver = await configurationParser.resolve({dynamicResolve: async () => ["c"]}, container);

    expect(fromResolver).toEqual(["a", "b"]);
    expect(Object.isFrozen(fromResolver)).toBe(true);
    expect(fromDynamicResolver).toEqual(["c"]);
    expect(Object.isFrozen(fromDynamicResolver)).toBe(true);
    // A basic value from a resolver is returned as it is.
    expect(await configurationParser.resolve({resolve: async () => "plain"}, container)).toBe("plain");
  })

  it("should still refuse a null and an object that is not a resolver", async () => {
    const configurationParser = new ConfigurationParser();
    // @ts-ignore
    await expect(configurationParser.resolve(null, container)).rejects.toThrowError(ConfigurationValidationError);
    // @ts-ignore
    await expect(configurationParser.resolve({a: 1}, container)).rejects.toThrowError(ConfigurationValidationError);
  })

  it("should throw when the ModuleConfigurationValue doesn't implement the DynamicConfigurationResolverInterface interface", async () => {
    const configurationParser = new ConfigurationParser();
    await expect(configurationParser.resolve(
      {
        // @ts-ignore
        allo: () => {
        }
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
});
