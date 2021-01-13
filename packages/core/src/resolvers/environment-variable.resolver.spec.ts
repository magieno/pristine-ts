import {BooleanResolver} from "./boolean.resolver";
import {EnvironmentVariableResolver} from "./environment-variable.resolver";

describe("Environment Variable Resolver", () => {
    it("should return the environment variable", async () => {
        process.env["test"] = "testValue";

        expect(await (new EnvironmentVariableResolver("test")).resolve()).toBe("testValue");
    });

    it("should throw if the environment variable doesn't exist", () => {
        return expect((new EnvironmentVariableResolver("NotFoundValue")).resolve()).rejects.toThrow();
    });
});
