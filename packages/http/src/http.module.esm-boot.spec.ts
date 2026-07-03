import "reflect-metadata";
import {Kernel} from "@pristine-ts/core";
import {AppModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {HttpModule} from "./http.module";

/**
 * Guards two invariants an HTTP/Lambda app relies on to boot in an ESM-bundled runtime:
 *  - booting a kernel that imports HttpModule, and constructing every EventHandler on the per-event
 *    dispatch path, never throws (a handler/command reading a CommonJS-only global such as
 *    `__dirname` in a constructor would throw `ReferenceError: __dirname is not defined` here); and
 *  - HttpModule pulls no `@pristine-ts/cli` machinery into that graph.
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
    // Dispatching an event resolves the EventDispatcher from a fresh child container, which eagerly
    // constructs every EventHandler. This is the point where a handler/command that reads a
    // CJS-only global (e.g. `__dirname`) in a constructor or field initializer would throw in a
    // bundled-ESM runtime, so asserting no throw here covers that whole construction path.
    const kernel = new Kernel();
    await kernel.start(appModuleWithHttp());

    const childContainer = kernel.container.createChildContainer();
    childContainer.register(ServiceDefinitionTagEnum.CurrentChildContainer, {useValue: childContainer});

    expect(() => childContainer.resolve("EventDispatcherInterface")).not.toThrow();
  });
});
