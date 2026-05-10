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

describe("Kernel.stop", () => {
  beforeEach(() => {
    container.clearInstances();
  });

  it("invokes onShutdown hooks in reverse instantiation order", async () => {
    const order: string[] = [];

    const leafModule: ModuleInterface = {
      keyname: "test.leaf",
      onShutdown: async () => { order.push("leaf"); },
    };
    const branchModule: ModuleInterface = {
      keyname: "test.branch",
      importModules: [leafModule],
      onShutdown: async () => { order.push("branch"); },
    };
    const rootModule: AppModuleInterface = {
      keyname: "test.root",
      importModules: [CoreModule, branchModule],
      importServices: [],
      onShutdown: async () => { order.push("root"); },
    };

    const kernel = new Kernel();
    await kernel.start(rootModule, {
      "pristine.logging.consoleLoggerActivated": false,
      "pristine.logging.fileLoggerActivated": false,
    });
    await kernel.stop();

    // Root shuts down first; leaf last. CoreModule has no onShutdown so it's silently skipped.
    expect(order).toEqual(["root", "branch", "leaf"]);
  });

  it("continues shutting down other modules when one onShutdown throws", async () => {
    const order: string[] = [];

    const goodModule: ModuleInterface = {
      keyname: "test.good",
      onShutdown: async () => { order.push("good"); },
    };
    const badModule: ModuleInterface = {
      keyname: "test.bad",
      onShutdown: async () => { throw new Error("boom"); },
    };
    const rootModule: AppModuleInterface = {
      keyname: "test.root2",
      importModules: [CoreModule, goodModule, badModule],
      importServices: [],
    };

    const kernel = new Kernel();
    await kernel.start(rootModule, {
      "pristine.logging.consoleLoggerActivated": false,
      "pristine.logging.fileLoggerActivated": false,
    });

    await expect(kernel.stop()).resolves.toBeUndefined();
    // bad threw — but good still ran (it shuts down before bad in reverse order:
    // bad was registered AFTER good, so bad gets reversed to run first, throws,
    // then good runs).
    expect(order).toContain("good");
  });

  it("is idempotent: a second stop() is a no-op", async () => {
    let calls = 0;
    const trackedModule: ModuleInterface = {
      keyname: "test.idempotent",
      onShutdown: async () => { calls++; },
    };

    const kernel = new Kernel();
    await kernel.start({
      keyname: "test.root3",
      importModules: [CoreModule, trackedModule],
      importServices: [],
    } as AppModuleInterface, {
      "pristine.logging.consoleLoggerActivated": false,
      "pristine.logging.fileLoggerActivated": false,
    });

    await kernel.stop();
    await kernel.stop();
    await kernel.stop();

    expect(calls).toBe(1);
  });

  it("times out a hung onShutdown and continues", async () => {
    let secondRan = false;

    const hangingModule: ModuleInterface = {
      keyname: "test.hanging",
      onShutdown: () => new Promise(() => {/* never resolves */}),
    };
    const fastModule: ModuleInterface = {
      keyname: "test.fast",
      onShutdown: async () => { secondRan = true; },
    };

    const kernel = new Kernel();
    await kernel.start({
      keyname: "test.root4",
      // Order matters: fast first (registered first in reverse → runs last after hanging),
      // hanging registered later (runs first via reverse iteration).
      importModules: [CoreModule, fastModule, hangingModule],
      importServices: [],
    } as AppModuleInterface, {
      "pristine.logging.consoleLoggerActivated": false,
      "pristine.logging.fileLoggerActivated": false,
    });

    const startedAt = Date.now();
    await kernel.stop({perHookTimeoutMs: 50});

    // hanging timed out after ~50ms; fast still ran afterwards.
    expect(secondRan).toBe(true);
    expect(Date.now() - startedAt).toBeLessThan(1000);
  });
});
