import {AppModuleInterface, ModuleInterface} from "@pristine-ts/common";
import {CoreModule, Kernel} from "@pristine-ts/core";
import {container, DependencyContainer, inject, injectable, injectAll, InjectionToken} from "tsyringe";

describe("Configuration", () => {
    it("should register all the parameters in the container", async () => {

        const module: AppModuleInterface = {
            keyname: "test",

            importModules: [
                CoreModule,
            ],
            providerRegistrations: [],
            configurationDefinitions: [
                {
                    parameterName: "test.test1Parameter",
                    isRequired: true,
                },
                {
                    parameterName: "test.test2Parameter",
                    isRequired: false,
                    defaultValue: "test2",
                }
            ],
            importServices: [],
        };

        const kernel = new Kernel();
        await kernel.start(module, {
            "test.test1Parameter": "NotDefault",
        });

        expect(kernel.container.resolve("%test.test1Parameter%")).toBe("NotDefault")
        expect(kernel.container.resolve("%test.test2Parameter%")).toBe("test2")
    })

    it("should inject a configuration parameter in a class if you use the right token", async () => {
        interface ConfigurationDefstartionInterface {
            test1Parameter: string;
            test2Parameter?: string;
        }

        class ConfigurationDefstartion implements ConfigurationDefstartionInterface {
            test1Parameter: string = "test1";
            test2Parameter: string = "test2";
        }

        const module: AppModuleInterface = {
            keyname: "test",


            importModules: [
                CoreModule,
            ],
            providerRegistrations: [],
            configurationDefinitions: [
                {
                    parameterName: "test.test1Parameter",
                    isRequired: true,
                },
                {
                    parameterName: "test.test2Parameter",
                    isRequired: false,
                    defaultValue: "test2",
                }
            ],
            importServices: [],
        };

        @injectable()
        class TestConfigurationParameterInjectedInConstructor {
            public constructor(@inject("%test.test1Parameter%") public readonly test1Parameter: string, @inject("%test.test2Parameter%") public readonly test2Parameter: string,) {
            }
        }

        const kernel = new Kernel();
        await kernel.start(module, {
            "test.test1Parameter": "NotDefault",
        });

        const instance = kernel.container.resolve(TestConfigurationParameterInjectedInConstructor);
        expect(instance.test1Parameter).toBe("NotDefault");
        expect(instance.test2Parameter).toBe("test2");
    })
})
