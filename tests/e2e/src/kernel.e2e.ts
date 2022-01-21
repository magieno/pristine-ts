import "reflect-metadata"
import {ResolvedClassModel} from "./models/resolved-class.model";
import {testModule} from "./test.module";
import {PermissionManager} from "./managers/permission.manager";
import {container, DependencyContainer, inject, injectable, injectAll, InjectionToken} from "tsyringe";
import {HttpError, RequestInterceptorInterface, Route, RouterInterface,} from "@pristine-ts/networking";
import {
    AppModuleInterface,
    HttpMethod,
    ModuleInterface,
    moduleScoped,
    Request,
    Response,
    tag
} from "@pristine-ts/common";
import {CoreModule, ExecutionContextKeynameEnum, Kernel,} from "@pristine-ts/core";
import {DependencyContainerMock} from "../../mocks/dependency.container.mock";

describe("Kernel.ts", () => {
    beforeEach(async () => {
        // Very important to clear the instances in between executions.
        container.clearInstances();
    })

    it("should test the Kernel", async () => {
        const kernel = new Kernel();
        await kernel.start(testModule, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const resolvedClassModel = kernel.container.resolve<ResolvedClassModel>(ResolvedClassModel);
        const permissionManager = kernel.container.resolveAll(PermissionManager)

        // const response = await kernel.handleRequest(request);


        expect(resolvedClassModel.getRandomNumber()).toBeGreaterThan(0);
    })


    it("should inject all the services that are tagged with the tag decorator", async () => {
        @tag("taggedClass")
        @injectable()
        class FirstClassToBeInjected {
            public element: string;

            public constructor() {
                this.element = "Injected";
            }
        }

        @tag("taggedClass")
        @injectable()
        class SecondClassToBeInjected {
            public element: string;

            public constructor() {
                this.element = "Injected";
            }
        }

        @injectable()
        class ClassThatHasAllTheOthersInjected {
            public constructor(@injectAll("taggedClass") public readonly taggedClasses: any[]) {
            }
        }

        const module: AppModuleInterface = {
            keyname: "test",
            importModules: [
                CoreModule,
            ],
            providerRegistrations: [],
            importServices: [],
        };


        const kernel = new Kernel();

        await kernel.start(module, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const classThatHasAllTheOthersInjected = kernel.container.resolve(ClassThatHasAllTheOthersInjected);
        expect(classThatHasAllTheOthersInjected.taggedClasses.length).toBe(2);
    })


    describe("Scoped modules", () => {
        const module1Keyname = "testModule1";
        const module2Keyname = "testModule2";
        const module3Keyname = "testModule3";

        @tag("CommonTag")
        @moduleScoped(module1Keyname)
        @injectable()
        class TestClass1 {
            testFunction() {
                return
            }
        }

        @tag("CommonTag")
        @moduleScoped(module2Keyname)
        @injectable()
        class TestClass2 {
            testFunction() {
                return
            }
        }

        @tag("CommonTag")
        @moduleScoped(module3Keyname)
        @injectable()
        class TestClass3 {
            testFunction() {
                return
            }
        }

        const testModule1: ModuleInterface = {
            keyname: module1Keyname,

        }

        const testModule2: ModuleInterface = {
            keyname: module2Keyname,

        }

        const testModule3: ModuleInterface = {
            keyname: module3Keyname,

        }

        it("should only resolve classes from imported modules", async () => {
            const module: AppModuleInterface = {
                keyname: "Module",
                importModules: [
                    CoreModule,
                    testModule1,
                    testModule2,
                ],
                importServices: [],
            }

            const kernel = new Kernel();

            await kernel.start(module, {
                "pristine.logging.consoleLoggerActivated": false,
                "pristine.logging.fileLoggerActivated": false,
            });

            expect(kernel.container.resolveAll("CommonTag").length).toBe(2);
        })
    })
})
