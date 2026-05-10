import "reflect-metadata";
import fs from "fs";
import os from "os";
import path from "path";
import {AppModuleDiscoverer} from "./app-module-discoverer";
import {AppModuleDiscoveryReasonEnum} from "./app-module-discovery-reason.enum";

describe("AppModuleDiscoverer", () => {
  let projectRoot: string;
  let discoverer: AppModuleDiscoverer;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pristine-discovery-"));
    fs.mkdirSync(path.join(projectRoot, "dist"), {recursive: true});
    discoverer = new AppModuleDiscoverer();
  });

  afterEach(() => {
    fs.rmSync(projectRoot, {recursive: true, force: true});
  });

  const writeAppModuleFile = (relPath: string, exportsAppModule: boolean = true) => {
    const abs = path.resolve(projectRoot, relPath);
    fs.mkdirSync(path.dirname(abs), {recursive: true});
    const body = exportsAppModule
      ? "module.exports = { AppModule: { keyname: 'test' } };"
      : "module.exports = { OtherModule: { keyname: 'test' } };";
    fs.writeFileSync(abs, body);
  }

  it("returns no candidates when no module files exist", async () => {
    const candidates = await discoverer.discover(projectRoot);
    expect(candidates).toEqual([]);
  });

  it("returns dist/app.module.js with score 0 when present", async () => {
    writeAppModuleFile("dist/app.module.js");

    const candidates = await discoverer.discover(projectRoot);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].score).toBe(0);
    expect(candidates[0].reason).toBe(AppModuleDiscoveryReasonEnum.Named);
    expect(candidates[0].displayPath).toBe(path.join("dist", "app.module.js"));
  });

  it("returns *.module.js files exporting AppModule with score 10", async () => {
    writeAppModuleFile("dist/admin.module.js");

    const candidates = await discoverer.discover(projectRoot);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].score).toBe(10);
    expect(candidates[0].reason).toBe(AppModuleDiscoveryReasonEnum.Exports);
  });

  it("excludes *.module.js files that do not export AppModule", async () => {
    writeAppModuleFile("dist/sub.module.js", false);

    const candidates = await discoverer.discover(projectRoot);

    expect(candidates).toEqual([]);
  });

  it("excludes test and spec files even when named like modules", async () => {
    writeAppModuleFile("dist/app.module.spec.js");
    writeAppModuleFile("dist/app.module.test.js");

    const candidates = await discoverer.discover(projectRoot);

    expect(candidates).toEqual([]);
  });

  it("ranks app.module.* above other *.module.* files", async () => {
    writeAppModuleFile("dist/app.module.js");
    writeAppModuleFile("dist/admin.module.js");

    const candidates = await discoverer.discover(projectRoot);

    expect(candidates).toHaveLength(2);
    expect(candidates[0].displayPath).toBe(path.join("dist", "app.module.js"));
    expect(candidates[0].score).toBe(0);
    expect(candidates[1].score).toBe(10);
  });

  it("scans dist/lib/cjs in addition to dist/", async () => {
    writeAppModuleFile("dist/lib/cjs/app.module.js");

    const candidates = await discoverer.discover(projectRoot);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].displayPath).toBe(path.join("dist", "lib", "cjs", "app.module.js"));
  });

  it("returns multiple equally-ranked candidates when several app.module.* exist", async () => {
    writeAppModuleFile("dist/app.module.js");
    writeAppModuleFile("dist/lib/cjs/app.module.js");
    writeAppModuleFile("dist/lib/esm/app.module.mjs");

    const candidates = await discoverer.discover(projectRoot);

    expect(candidates).toHaveLength(3);
    expect(candidates.every(c => c.score === 0)).toBe(true);
  });
});
