import "reflect-metadata";
import {container, DependencyContainer, injectable} from "tsyringe";
import {AppModuleInterface, ModuleInterface, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {CoreModule} from "./core.module";
import {Kernel} from "./kernel";
import {InstantiationStatusEnum} from "./enums/instantiation-status.enum";
import {InstantiationPhaseEnum} from "./enums/instantiation-phase.enum";
import {InstantiationTestInterface, InstantiationTestResultInterface} from "./interfaces/instantiation-test.interface";

describe("Kernel.verifyInstantiation", () => {
  beforeEach(() => {
    container.clearInstances();
  });

  const baseAppModule = (overrides: Partial<AppModuleInterface> = {}): AppModuleInterface => ({
    keyname: "test.app",
    importModules: [CoreModule],
    importServices: [],
    ...overrides,
  });

  it("returns Passed when boot succeeds and no tests are registered", async () => {
    const kernel = new Kernel();
    const report = await kernel.verifyInstantiation(baseAppModule(), {
      "pristine.logging.consoleLoggerActivated": false,
      "pristine.logging.fileLoggerActivated": false,
    });

    expect(report.overallStatus).toBe(InstantiationStatusEnum.Passed);
    expect(report.hasErrors).toBe(false);
    expect(report.phases.every(p => p.status === InstantiationStatusEnum.Passed)).toBe(true);
    expect(report.missingRequiredConfiguration).toEqual([]);
  });

  it("marks ConfigurationCheck PassedWithWarnings and surfaces missing required entries", async () => {
    const moduleWithRequired: ModuleInterface = {
      keyname: "test.requires",
      configurationDefinitions: [{parameterName: "test.requires.value", isRequired: true}],
    };
    const appModule = baseAppModule({importModules: [CoreModule, moduleWithRequired]});

    const kernel = new Kernel();
    const report = await kernel.verifyInstantiation(appModule, {
      "pristine.logging.consoleLoggerActivated": false,
      "pristine.logging.fileLoggerActivated": false,
    });

    expect(report.missingRequiredConfiguration).toEqual([
      {parameterName: "test.requires.value", hasDefaultResolvers: false},
    ]);
    const checkPhase = report.phases.find(p => p.phase === InstantiationPhaseEnum.ConfigurationCheck);
    expect(checkPhase?.status).toBe(InstantiationStatusEnum.PassedWithWarnings);
  });

  it("marks ConfigurationLoad Failed when a required value with no resolver is missing", async () => {
    const moduleWithRequired: ModuleInterface = {
      keyname: "test.requires2",
      configurationDefinitions: [{parameterName: "test.requires2.value", isRequired: true}],
    };
    const appModule = baseAppModule({importModules: [CoreModule, moduleWithRequired]});

    const kernel = new Kernel();
    const report = await kernel.verifyInstantiation(appModule, {
      "pristine.logging.consoleLoggerActivated": false,
      "pristine.logging.fileLoggerActivated": false,
    });

    const loadPhase = report.phases.find(p => p.phase === InstantiationPhaseEnum.ConfigurationLoad);
    expect(loadPhase?.status).toBe(InstantiationStatusEnum.Failed);
    expect(report.hasErrors).toBe(true);
    expect(report.overallStatus).toBe(InstantiationStatusEnum.Failed);
  });

  it("captures errors thrown from module.onInit as a Failed ModuleRegistration phase and skips the rest", async () => {
    const throwingModule: ModuleInterface = {
      keyname: "test.throws",
      onInit: async () => {
        throw new Error("onInit boom");
      },
    };
    const appModule = baseAppModule({importModules: [CoreModule, throwingModule]});

    const kernel = new Kernel();
    const report = await kernel.verifyInstantiation(appModule, {
      "pristine.logging.consoleLoggerActivated": false,
      "pristine.logging.fileLoggerActivated": false,
    });

    const moduleRegistration = report.phases.find(p => p.phase === InstantiationPhaseEnum.ModuleRegistration);
    expect(moduleRegistration?.status).toBe(InstantiationStatusEnum.Failed);
    expect(moduleRegistration?.error?.message).toContain("onInit boom");
    expect(report.phases.filter(p => p.status === InstantiationStatusEnum.Skipped).length).toBeGreaterThan(0);
    expect(report.hasErrors).toBe(true);
  });

  it("runs registered InstantiationTestInterface implementations and reports their results", async () => {
    @tag(ServiceDefinitionTagEnum.InstantiationTest)
    @injectable()
    class PassingTest implements InstantiationTestInterface {
      name = "passing-test";
      async run(_: DependencyContainer): Promise<InstantiationTestResultInterface> {
        return {passed: true, message: "ok"};
      }
    }

    @tag(ServiceDefinitionTagEnum.InstantiationTest)
    @injectable()
    class FailingTest implements InstantiationTestInterface {
      name = "failing-test";
      async run(_: DependencyContainer): Promise<InstantiationTestResultInterface> {
        return {passed: false, message: "nope"};
      }
    }

    @tag(ServiceDefinitionTagEnum.InstantiationTest)
    @injectable()
    class ThrowingTest implements InstantiationTestInterface {
      name = "throwing-test";
      async run(_: DependencyContainer): Promise<InstantiationTestResultInterface> {
        throw new Error("kaboom");
      }
    }

    // Reference the classes so the @tag side effect runs (TypeScript otherwise tree-shakes them).
    void PassingTest;
    void FailingTest;
    void ThrowingTest;

    const kernel = new Kernel();
    const report = await kernel.verifyInstantiation(baseAppModule(), {
      "pristine.logging.consoleLoggerActivated": false,
      "pristine.logging.fileLoggerActivated": false,
    });

    const names = report.instantiationTests.map(t => t.name).sort();
    expect(names).toEqual(["failing-test", "passing-test", "throwing-test"]);
    expect(report.succeededInstantiationTests.map(t => t.name)).toEqual(["passing-test"]);
    expect(report.failedInstantiationTests.map(t => t.name).sort()).toEqual(["failing-test", "throwing-test"]);
    const throwing = report.instantiationTests.find(t => t.name === "throwing-test");
    expect(throwing?.error?.message).toBe("kaboom");
    expect(report.hasErrors).toBe(true);
  });

  it("skips the InstantiationTests phase when runInstantiationTests is false", async () => {
    const kernel = new Kernel();
    const report = await kernel.verifyInstantiation(baseAppModule(), {
      "pristine.logging.consoleLoggerActivated": false,
      "pristine.logging.fileLoggerActivated": false,
    }, {runInstantiationTests: false});

    const testPhase = report.phases.find(p => p.phase === InstantiationPhaseEnum.InstantiationTests);
    expect(testPhase?.status).toBe(InstantiationStatusEnum.Skipped);
  });

  it("stamps a LogHandler onto the report after ModuleRegistration succeeds", async () => {
    const kernel = new Kernel();
    const report = await kernel.verifyInstantiation(baseAppModule(), {
      "pristine.logging.consoleLoggerActivated": false,
      "pristine.logging.fileLoggerActivated": false,
    });

    expect(report.logHandler).toBeDefined();
  });
});
