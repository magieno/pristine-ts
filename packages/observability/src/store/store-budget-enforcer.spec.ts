import "reflect-metadata";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {PartitionIndex} from "./partition-index";
import {StoreBudgetEnforcer} from "./store-budget-enforcer";
import {ObservabilityPaths} from "../paths/observability-paths";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pristine-obs-budget-"));
}

interface BuildOptions {
  maxStoreSize?: number;
  maxRetentionAge?: number;
  retainedInstances?: number;
  maxLogFiles?: number;
}

function build(directory: string, currentPartition: string, options: BuildOptions = {}) {
  const partitions = new PartitionIndex(directory, currentPartition);
  const enforcer = new StoreBudgetEnforcer(
    options.maxStoreSize ?? 0,
    options.maxRetentionAge ?? 0,
    options.retainedInstances ?? 10,
    options.maxLogFiles ?? 3,
    partitions,
  );
  return {partitions, enforcer, paths: new ObservabilityPaths(directory)};
}

/**
 * Writes a partition directory holding `bytes` of live log data, optionally with rotated
 * generations and trace files. `ageMs` back-dates it so age-based retention can be tested
 * without waiting.
 */
function seedPartition(paths: ObservabilityPaths, name: string, options: {
  bytes?: number;
  rotatedBytes?: number[];
  traces?: number;
  traceBytes?: number;
  ageMs?: number;
  pid?: number;
} = {}): void {
  fs.mkdirSync(paths.tracesDirectory(name), {recursive: true});
  fs.writeFileSync(paths.logsFile(name), "x".repeat(options.bytes ?? 10));

  (options.rotatedBytes ?? []).forEach((bytes, index) => {
    fs.writeFileSync(ObservabilityPaths.rotated(paths.logsFile(name), index + 1), "r".repeat(bytes));
  });

  for (let index = 0; index < (options.traces ?? 0); index++) {
    fs.writeFileSync(paths.traceFile(name, `trace-${index}`), "t".repeat(options.traceBytes ?? 10));
  }

  if (options.pid !== undefined) {
    fs.writeFileSync(paths.pidFile(name), `${options.pid}`);
  }

  if (options.ageMs !== undefined) {
    const when = new Date(Date.now() - options.ageMs);
    fs.utimesSync(paths.instanceDirectory(name), when, when);
  }
}

/**
 * A pid that is guaranteed not to be running: allocate an unlikely-but-valid value and
 * confirm the probe fails. Used to assert that a *stale* pid file does not protect a
 * partition.
 */
function deadPid(): number {
  for (let candidate = 4_194_300; candidate > 4_000_000; candidate--) {
    try {
      process.kill(candidate, 0);
    } catch {
      return candidate;
    }
  }
  return 4_194_303;
}

describe("StoreBudgetEnforcer", () => {
  it("drops partitions beyond the retained count, sparing the current one", async () => {
    const directory = makeTempDir();
    const {enforcer, paths} = build(directory, "current", {retainedInstances: 2});

    for (const name of ["old-a", "old-b", "old-c"]) {
      seedPartition(paths, name);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    seedPartition(paths, "current");

    enforcer.enforce();

    expect(fs.readdirSync(directory).sort()).toEqual(["current", "old-c"]);
  });

  it("drops partitions past the age limit", () => {
    const directory = makeTempDir();
    const {enforcer, paths} = build(directory, "current", {maxRetentionAge: 60 * 60 * 1000});

    seedPartition(paths, "ancient", {ageMs: 48 * 60 * 60 * 1000});
    seedPartition(paths, "recent");
    seedPartition(paths, "current");

    enforcer.enforce();

    expect(fs.readdirSync(directory).sort()).toEqual(["current", "recent"]);
  });

  it("spares a partition owned by a live process, even past the retained count", async () => {
    const directory = makeTempDir();
    const {enforcer, paths} = build(directory, "current", {retainedInstances: 1});

    // `process.pid` is by definition alive — it stands in for a concurrent worker.
    seedPartition(paths, "other-worker", {pid: process.pid});
    await new Promise(resolve => setTimeout(resolve, 20));
    seedPartition(paths, "abandoned", {pid: deadPid()});
    await new Promise(resolve => setTimeout(resolve, 20));
    seedPartition(paths, "current");

    enforcer.enforce();

    const remaining = fs.readdirSync(directory).sort();
    expect(remaining).toContain("other-worker");
    expect(remaining).toContain("current");
    expect(remaining).not.toContain("abandoned");
  });

  it("deletes whole abandoned partitions until the store fits the byte budget", async () => {
    const directory = makeTempDir();
    const {enforcer, paths} = build(directory, "current", {maxStoreSize: 2_500});

    seedPartition(paths, "old-a", {bytes: 1_000});
    await new Promise(resolve => setTimeout(resolve, 20));
    seedPartition(paths, "old-b", {bytes: 1_000});
    await new Promise(resolve => setTimeout(resolve, 20));
    seedPartition(paths, "current", {bytes: 1_000});

    enforcer.enforce();

    const remaining = fs.readdirSync(directory).sort();
    expect(remaining).toEqual(["current", "old-b"]);
  });

  it("trims rotated generations and trace files from live partitions as a last resort", () => {
    const directory = makeTempDir();
    const {enforcer, paths} = build(directory, "current", {maxStoreSize: 1_200, maxLogFiles: 3});

    // One live partition, far over budget: 500 live + 2×500 rotated + 5×200 traces.
    seedPartition(paths, "current", {bytes: 500, rotatedBytes: [500, 500], traces: 5, traceBytes: 200});

    enforcer.enforce();

    // The live file is never touched — a running writer must not lose it.
    expect(fs.existsSync(paths.logsFile("current"))).toBe(true);
    expect(fs.statSync(paths.logsFile("current")).size).toBe(500);

    const total = fs.readdirSync(paths.instanceDirectory("current"), {withFileTypes: true})
      .filter(entry => entry.isFile())
      .reduce((sum, entry) => sum + fs.statSync(path.join(paths.instanceDirectory("current"), entry.name)).size, 0)
      + fs.readdirSync(paths.tracesDirectory("current"))
        .reduce((sum, name) => sum + fs.statSync(path.join(paths.tracesDirectory("current"), name)).size, 0);
    expect(total).toBeLessThanOrEqual(1_200);
  });

  it("notifies listeners when a sweep pruned the current partition", () => {
    const directory = makeTempDir();
    const {enforcer, paths} = build(directory, "current", {maxStoreSize: 400});
    seedPartition(paths, "current", {bytes: 100, rotatedBytes: [500], traces: 3, traceBytes: 100});

    let notified = 0;
    enforcer.onCurrentPartitionPruned(() => notified++);
    enforcer.enforce();

    expect(notified).toBe(1);
  });

  it("does not enforce the byte ceiling when maxStoreSize is 0", () => {
    const directory = makeTempDir();
    const {enforcer, paths} = build(directory, "current", {maxStoreSize: 0});
    seedPartition(paths, "current", {bytes: 10_000, rotatedBytes: [10_000]});

    enforcer.enforce();

    expect(fs.existsSync(ObservabilityPaths.rotated(paths.logsFile("current"), 1))).toBe(true);
  });

  it("sweeps once enough bytes have been recorded, not on every write", async () => {
    const directory = makeTempDir();
    const {enforcer, paths} = build(directory, "current", {maxStoreSize: 4 * 1024 * 1024, retainedInstances: 1});
    seedPartition(paths, "abandoned", {bytes: 10, pid: deadPid()});
    await new Promise(resolve => setTimeout(resolve, 20));
    seedPartition(paths, "current");

    // Well below the sweep interval (5% of the budget, floored at 1 MB): nothing runs,
    // so the partition a sweep *would* drop is still there.
    enforcer.recordBytes(1_000);
    expect(fs.existsSync(paths.instanceDirectory("abandoned"))).toBe(true);

    // A rotation forces a sweep whatever the accumulated volume.
    enforcer.recordBytes(1_000, true);
    expect(fs.existsSync(paths.instanceDirectory("abandoned"))).toBe(false);
  });

  it("sweeps once the accumulated volume crosses the interval", async () => {
    const directory = makeTempDir();
    const {enforcer, paths} = build(directory, "current", {maxStoreSize: 100 * 1024 * 1024, retainedInstances: 1});
    seedPartition(paths, "abandoned", {bytes: 10, pid: deadPid()});
    await new Promise(resolve => setTimeout(resolve, 20));
    seedPartition(paths, "current");

    enforcer.recordBytes(4 * 1024 * 1024);
    expect(fs.existsSync(paths.instanceDirectory("abandoned"))).toBe(true);

    // 5% of 100 MB = 5 MB.
    enforcer.recordBytes(1 * 1024 * 1024);
    expect(fs.existsSync(paths.instanceDirectory("abandoned"))).toBe(false);
  });
});
