import "reflect-metadata";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {ObservabilityRunManager} from "./observability-run-manager";
import {ObservabilityPaths} from "../utils/observability-paths";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pristine-obs-"));
}

interface RunManagerOverrides {
  enabled?: boolean;
  retainedRuns?: number;
  autoBegin?: boolean;
  maxRunSizeBytes?: number;
}

function buildRunManager(directory: string, runId: string, overrides: RunManagerOverrides = {}): ObservabilityRunManager {
  return new ObservabilityRunManager(
    overrides.enabled ?? true,
    directory,
    overrides.retainedRuns ?? 10,
    overrides.autoBegin ?? false,
    overrides.maxRunSizeBytes ?? 100 * 1024 * 1024,
    runId,
  );
}

describe("ObservabilityRunManager", () => {
  it("creates the run directory, run.json and latest.json on beginRun", () => {
    const directory = makeTempDir();
    const manager = buildRunManager(directory, "run-a");

    expect(manager.isRunActive()).toBe(false);
    manager.beginRun("start");
    expect(manager.isRunActive()).toBe(true);

    const paths = new ObservabilityPaths(directory);
    expect(fs.existsSync(paths.runMetadataFile("run-a"))).toBe(true);
    expect(fs.existsSync(paths.tracesDirectory("run-a"))).toBe(true);
    expect(JSON.parse(fs.readFileSync(paths.latestPointerFile(), "utf8")).runId).toBe("run-a");

    manager.endRun();
    expect(manager.isRunActive()).toBe(false);
    expect(JSON.parse(fs.readFileSync(paths.runMetadataFile("run-a"), "utf8")).endedAt).toBeDefined();
  });

  it("stays dormant when observability is disabled", () => {
    const directory = makeTempDir();
    const manager = buildRunManager(directory, "run-x", {enabled: false});
    manager.beginRun("start");
    expect(manager.isRunActive()).toBe(false);
    expect(manager.logsFile()).toBeUndefined();
  });

  it("prunes runs beyond the retained limit", () => {
    const directory = makeTempDir();
    const paths = new ObservabilityPaths(directory);
    for (const [name, startedAt] of [["old1", 1], ["old2", 2], ["old3", 3]] as const) {
      fs.mkdirSync(paths.runDirectory(name), {recursive: true});
      fs.writeFileSync(paths.runMetadataFile(name), JSON.stringify({runId: name, startedAt: new Date(startedAt).toISOString()}));
    }

    buildRunManager(directory, "run-new", {retainedRuns: 2}).beginRun("start");

    const remaining = fs.readdirSync(paths.runsDirectory()).sort();
    expect(remaining).toEqual(["old3", "run-new"]);
  });

  it("auto-begins a run on first store access when autoBegin is enabled", () => {
    const directory = makeTempDir();
    const manager = buildRunManager(directory, "run-auto", {autoBegin: true});

    expect(manager.isRunActive()).toBe(false);
    expect(manager.logsFile()).toBeDefined();
    expect(manager.isRunActive()).toBe(true);
  });

  it("does not auto-begin when autoBegin is disabled", () => {
    const directory = makeTempDir();
    const manager = buildRunManager(directory, "run-noauto");

    expect(manager.logsFile()).toBeUndefined();
    expect(manager.isRunActive()).toBe(false);
  });
});
