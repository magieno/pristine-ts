import "reflect-metadata";
import {Kernel} from "@pristine-ts/core";
import {AppModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {HttpModule} from "./http.module";

/**
 * Regression guards for the ESM/bundled-boot crash fixed in 3.0.4 and the CliModule decoupling in
 * this change. The original crash (`ReferenceError: __dirname is not defined`) fired when a plain
 * HTTP/Lambda app booted: HttpModule imported CliModule, whose InfoCommand read `__dirname` in an
 * eager field initializer, and the per-event EventDispatcher construction built it.
 *
 * These tests boot a real kernel that imports HttpModule and exercise the per-event handler
 * construction path, asserting it never throws and that no CLI machinery is dragged in.
 */
describe("HttpModule ESM/bundled-boot hardening", () => {
  const appModuleWithHttp = (): AppModuleInterface => ({
    keyname: "test.http-app",
    importModules: [HttpModule],
    importServices: [],
  });

  it("boots a kernel importing HttpModule without instantiation errors", async () => {
    const kernel = new Kernel();

    const report = await kernel.verifyInstantiation(appModuleWithHttp(), {}, {runInstantiationTests: true});

    expect(report.hasErrors).toBe(false);
  });

  it("does not drag CliModule (or any @pristine-ts/cli machinery) into the HTTP graph", async () => {
    const kernel = new Kernel();

    await kernel.verifyInstantiation(appModuleWithHttp(), {}, {runInstantiationTests: false});

    const moduleKeynames = Object.keys(kernel.instantiatedModules);
    expect(moduleKeynames).toContain("pristine.http");
    // The whole point of the decoupling: an HTTP/Lambda app never loads the CLI package.
    expect(moduleKeynames.some(keyname => keyname.includes("cli"))).toBe(false);
  });

  it("constructs every EventHandler on the per-event dispatch path without throwing", async () => {
    // Reproduces the exact step that crashed before 3.0.4: dispatching an event resolves the
    // EventDispatcher from a fresh child container, which eagerly constructs every EventHandler.
    // A handler/command that read a CJS-only global (e.g. `__dirname`) in a constructor or field
    // initializer would throw here in a bundled-ESM runtime. Asserting no throw guards against a
    // future class silently reintroducing that crash.
    const kernel = new Kernel();
    await kernel.start(appModuleWithHttp());

    const childContainer = kernel.container.createChildContainer();
    childContainer.register(ServiceDefinitionTagEnum.CurrentChildContainer, {useValue: childContainer});

    expect(() => childContainer.resolve("EventDispatcherInterface")).not.toThrow();
  });
});
