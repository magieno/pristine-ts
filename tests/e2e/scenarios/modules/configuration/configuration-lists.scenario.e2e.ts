import "reflect-metadata";
import {AppModuleInterface, injectConfig} from "@pristine-ts/common";
import {CoreModule, Kernel} from "@pristine-ts/core";
import {EnvironmentVariableResolver, StringListResolver} from "@pristine-ts/configuration";
import {injectable} from "tsyringe";

/**
 * A configuration value that is a list, through a real Kernel: given to `kernel.start`, read from
 * an environment variable by a resolver, or taken from the default; and injected into a service.
 */
describe("Configuration - lists", () => {
    const environmentVariable = "PRISTINE_E2E_LIST_ALLOWED_ORIGINS";

    @injectable()
    class OriginsService {
        constructor(@injectConfig("lists.allowedOrigins") public readonly allowedOrigins: readonly string[],
                    @injectConfig("lists.retryDelays") public readonly retryDelays: readonly number[]) {
        }
    }

    const module: AppModuleInterface = {
        keyname: "lists",
        importModules: [CoreModule],
        providerRegistrations: [],
        importServices: [OriginsService],
        configurationDefinitions: [
            {
                parameterName: "lists.allowedOrigins",
                isRequired: false,
                defaultValue: ["https://default.example.com"],
                defaultResolvers: [
                    new StringListResolver(new EnvironmentVariableResolver(environmentVariable)),
                ],
            },
            {
                parameterName: "lists.retryDelays",
                isRequired: false,
                defaultValue: [100, 500, 2000],
            },
        ],
    };

    const start = async (configuration: { [key: string]: any } = {}): Promise<Kernel> => {
        const kernel = new Kernel();
        await kernel.start(module, {"pristine.logging.consoleLoggerActivated": false, ...configuration});
        return kernel;
    };

    afterEach(() => {
        delete process.env[environmentVariable];
    });

    it("should inject the default lists into a service", async () => {
        const service = (await start()).container.resolve(OriginsService);

        expect(service.allowedOrigins).toEqual(["https://default.example.com"]);
        expect(service.retryDelays).toEqual([100, 500, 2000]);
    });

    it("should use the list that is given to kernel.start", async () => {
        const given = ["https://a.example.com", "https://b.example.com"];
        const service = (await start({"lists.allowedOrigins": given, "lists.retryDelays": []})).container.resolve(OriginsService);

        expect(service.allowedOrigins).toEqual(["https://a.example.com", "https://b.example.com"]);
        expect(service.retryDelays).toEqual([]);
        // The service does not hold the list of the caller.
        expect(service.allowedOrigins).not.toBe(given);
    });

    it("should read the list from an environment variable, comma-separated or as a JSON array", async () => {
        process.env[environmentVariable] = "https://a.example.com, https://b.example.com,";
        expect((await start()).container.resolve(OriginsService).allowedOrigins).toEqual(["https://a.example.com", "https://b.example.com"]);

        process.env[environmentVariable] = '["https://c.example.com/?a=1,2"]';
        expect((await start()).container.resolve(OriginsService).allowedOrigins).toEqual(["https://c.example.com/?a=1,2"]);
    });

    it("should give every consumer the same frozen list, so that one cannot change it for the others", async () => {
        const kernel = await start();
        const first = kernel.container.resolve(OriginsService);
        const second = kernel.container.resolve(OriginsService);

        expect(Object.isFrozen(first.allowedOrigins)).toBe(true);
        expect(() => (first.allowedOrigins as string[]).push("https://evil.example.com")).toThrow();
        expect(second.allowedOrigins).toEqual(["https://default.example.com"]);
    });

    it("should refuse at start a list that holds a list or an object", async () => {
        await expect(start({"lists.allowedOrigins": [["https://a.example.com"]]})).rejects.toThrow(/position 0/);
        await expect(start({"lists.allowedOrigins": ["https://a.example.com", {origin: "b"}]})).rejects.toThrow(/position 1/);
    });
});
