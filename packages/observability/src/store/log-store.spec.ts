import "reflect-metadata";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {LogModel, SeverityEnum} from "@pristine-ts/logging";
import {LogStore} from "./log-store";
import {PartitionIndex} from "./partition-index";
import {StoreBudgetEnforcer} from "./store-budget-enforcer";
import {ObservabilityPaths} from "../paths/observability-paths";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pristine-obs-"));
}

interface BuildOptions {
  enabled?: boolean;
  retainedInstances?: number;
  maxEntrySize?: number;
  maxLogFileSize?: number;
  maxLogFiles?: number;
  minimumSeverity?: number;
  maxStoreSize?: number;
  maxRetentionAge?: number;
}

function buildLogStore(directory: string, partitionId: string, options: BuildOptions = {}): LogStore {
  const partitions = new PartitionIndex(directory, partitionId);
  const budget = new StoreBudgetEnforcer(
    options.maxStoreSize ?? 100 * 1024 * 1024,
    options.maxRetentionAge ?? 0,
    options.retainedInstances ?? 10,
    options.maxLogFiles ?? 3,
    partitions,
  );
  return new LogStore(
    options.enabled ?? true,
    options.maxEntrySize ?? 64 * 1024,
    options.maxLogFileSize ?? 10 * 1024 * 1024,
    options.maxLogFiles ?? 3,
    options.minimumSeverity ?? SeverityEnum.Debug,
    partitions,
    budget,
  );
}

const tick = () => new Promise(resolve => setTimeout(resolve, 20));

describe("LogStore", () => {
  it("lazy-creates the partition directory and appends a log on first write", () => {
    const directory = makeTempDir();
    const store = buildLogStore(directory, "p1");

    const paths = new ObservabilityPaths(directory);
    expect(fs.existsSync(paths.instanceDirectory("p1"))).toBe(false);

    store.append(new LogModel(SeverityEnum.Info, "hello"));

    expect(fs.existsSync(paths.logsFile("p1"))).toBe(true);
    const entries = store.read();
    expect(entries).toHaveLength(1);
    expect(entries[0].message).toBe("hello");
    expect(entries[0].severity).toBe(SeverityEnum.Info);
  });

  it("claims the partition with a pid file so other processes spare it", () => {
    const directory = makeTempDir();
    const store = buildLogStore(directory, "p-claim");
    store.append(new LogModel(SeverityEnum.Info, "hello"));

    const pidFile = new ObservabilityPaths(directory).pidFile("p-claim");
    expect(fs.readFileSync(pidFile, "utf8")).toBe(`${process.pid}`);
  });

  it("is a no-op when capture is disabled", () => {
    const directory = makeTempDir();
    const store = buildLogStore(directory, "p2", {enabled: false});

    expect(store.isCaptureEnabled()).toBe(false);
    store.append(new LogModel(SeverityEnum.Info, "ignored"));

    expect(fs.existsSync(new ObservabilityPaths(directory).instanceDirectory("p2"))).toBe(false);
  });

  it("read() concatenates across partitions, newest-first", async () => {
    const directory = makeTempDir();
    const older = buildLogStore(directory, "older");
    older.append(new LogModel(SeverityEnum.Info, "old-message"));
    await tick();
    const newer = buildLogStore(directory, "newer");
    newer.append(new LogModel(SeverityEnum.Info, "new-message"));

    const reader = buildLogStore(directory, "reader");
    const entries = reader.read();
    expect(entries).toHaveLength(2);
    expect(entries[0].message).toBe("new-message");
    expect(entries[1].message).toBe("old-message");
  });

  it("read(id) filters by traceId / eventId / requestId across partitions", () => {
    const directory = makeTempDir();
    const store = buildLogStore(directory, "p-filter");

    const matchTrace = new LogModel(SeverityEnum.Info, "match-trace");
    matchTrace.traceId = "trace-X";
    const matchEvent = new LogModel(SeverityEnum.Info, "match-event");
    matchEvent.eventId = "trace-X";
    const matchRequest = new LogModel(SeverityEnum.Info, "match-request") as any;
    matchRequest.requestId = "trace-X";
    const noMatch = new LogModel(SeverityEnum.Info, "no-match");
    noMatch.traceId = "trace-Y";

    store.append(matchTrace);
    store.append(matchEvent);
    store.append(matchRequest);
    store.append(noMatch);

    const filtered = store.read("trace-X");
    expect(filtered).toHaveLength(3);
    expect(filtered.map(e => e.message).sort()).toEqual(["match-event", "match-request", "match-trace"]);
  });

  it("prunes oldest partitions beyond the retained limit on first write", async () => {
    const directory = makeTempDir();
    const paths = new ObservabilityPaths(directory);
    for (const name of ["p-a", "p-b", "p-c"]) {
      fs.mkdirSync(paths.instanceDirectory(name), {recursive: true});
      fs.writeFileSync(paths.logsFile(name), "");
      await tick();
    }

    const fresh = buildLogStore(directory, "p-new", {retainedInstances: 2});
    fresh.append(new LogModel(SeverityEnum.Info, "trigger-prune"));

    const remaining = fs.readdirSync(directory).sort();
    expect(remaining).toEqual(["p-c", "p-new"]);
  });

  it("serializes log objects with cycle protection", () => {
    const directory = makeTempDir();
    const store = buildLogStore(directory, "cycle");

    const log = new LogModel(SeverityEnum.Info, "cycle-test");
    const a: any = {label: "a"};
    const b: any = {label: "b", a};
    a.b = b;
    log.extra = {a};

    expect(() => store.append(log)).not.toThrow();
    const entries = store.read();
    expect(entries[0].extra.a.label).toBe("a");
    expect(entries[0].extra.a.b.label).toBe("b");
    expect(entries[0].extra.a.b.a).toBe("[Circular]");
  });

  it("tail() follows the latest partition's logs, optionally filtered by id", async () => {
    const directory = makeTempDir();
    const writer = buildLogStore(directory, "tail-partition");
    writer.append(new LogModel(SeverityEnum.Info, "pre-tail")); // creates the partition dir

    const reader = buildLogStore(directory, "reader");
    const lines: string[] = [];
    const handle = reader.tail("trace-tail", line => lines.push(line));

    const matching = new LogModel(SeverityEnum.Info, "post-tail-match");
    matching.traceId = "trace-tail";
    const skipped = new LogModel(SeverityEnum.Info, "post-tail-skip");
    skipped.traceId = "trace-other";
    writer.append(matching);
    writer.append(skipped);
    await new Promise(resolve => setTimeout(resolve, 200));

    handle.stop();
    expect(lines.length).toBe(1);
    expect(JSON.parse(lines[0]).message).toBe("post-tail-match");
  });

  describe("retention", () => {
    it("rotates the live file before it exceeds maxLogFileSize, keeping maxLogFiles generations", () => {
      const directory = makeTempDir();
      const store = buildLogStore(directory, "p-rotate", {maxLogFileSize: 400, maxLogFiles: 3});
      const logsFile = new ObservabilityPaths(directory).logsFile("p-rotate");

      for (let index = 0; index < 40; index++) {
        store.append(new LogModel(SeverityEnum.Info, `message-${index}`));
      }

      expect(fs.existsSync(ObservabilityPaths.rotated(logsFile, 1))).toBe(true);
      expect(fs.existsSync(ObservabilityPaths.rotated(logsFile, 2))).toBe(true);
      // Only `maxLogFiles` generations survive — a fourth never exists.
      expect(fs.existsSync(ObservabilityPaths.rotated(logsFile, 3))).toBe(false);

      for (const file of [logsFile, ObservabilityPaths.rotated(logsFile, 1), ObservabilityPaths.rotated(logsFile, 2)]) {
        expect(fs.statSync(file).size).toBeLessThanOrEqual(400);
      }
    });

    it("read() spans rotated generations in write order", () => {
      const directory = makeTempDir();
      const store = buildLogStore(directory, "p-generations", {maxLogFileSize: 400, maxLogFiles: 3});

      for (let index = 0; index < 12; index++) {
        store.append(new LogModel(SeverityEnum.Info, `message-${index}`));
      }

      const messages = store.read().map(entry => entry.message);
      expect(messages.length).toBeGreaterThan(1);
      // Whatever survived rotation is contiguous and still in write order.
      const indexes = messages.map(message => Number.parseInt(message.replace("message-", ""), 10));
      expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
      expect(indexes[indexes.length - 1]).toBe(11);
    });

    it("read({limit}) returns the newest entries only", () => {
      const directory = makeTempDir();
      const store = buildLogStore(directory, "p-limit");

      for (let index = 0; index < 50; index++) {
        store.append(new LogModel(SeverityEnum.Info, `message-${index}`));
      }

      const entries = store.read(undefined, {limit: 3});
      expect(entries.map(entry => entry.message)).toEqual(["message-47", "message-48", "message-49"]);
    });

    it("drops entries below the configured severity threshold", () => {
      const directory = makeTempDir();
      const store = buildLogStore(directory, "p-severity", {minimumSeverity: SeverityEnum.Info});

      store.append(new LogModel(SeverityEnum.Debug, "debug-noise"));
      store.append(new LogModel(SeverityEnum.Info, "kept"));
      store.append(new LogModel(SeverityEnum.Error, "also-kept"));

      expect(store.read().map(entry => entry.message)).toEqual(["kept", "also-kept"]);
    });

    it("drops the extra payload of an entry that busts maxEntrySize", () => {
      const directory = makeTempDir();
      const store = buildLogStore(directory, "p-entry-size", {maxEntrySize: 512});

      const log = new LogModel(SeverityEnum.Error, "huge");
      log.eventId = "event-huge";
      log.extra = {payload: "x".repeat(10_000)};
      store.append(log);

      const entry = store.read()[0];
      expect(entry.extra).toBeUndefined();
      expect(entry.extraOmitted).toBe(true);
      // Correlation fields survive, so the entry is still findable.
      expect(entry.eventId).toBe("event-huge");
      expect(entry.message).toBe("huge");
      expect(fs.statSync(new ObservabilityPaths(directory).logsFile("p-entry-size")).size).toBeLessThanOrEqual(513);
    });

    it("keeps a pathological entry writable by falling back to correlation fields only", () => {
      const directory = makeTempDir();
      const store = buildLogStore(directory, "p-pathological", {maxEntrySize: 256});

      const log = new LogModel(SeverityEnum.Error, "m".repeat(5_000));
      log.eventId = "event-pathological";
      log.highlights = {blob: "h".repeat(5_000)};
      store.append(log);

      const entry = store.read()[0];
      expect(entry.truncated).toBe(true);
      expect(entry.eventId).toBe("event-pathological");
      expect(entry.message.length).toBeLessThanOrEqual(1024);
    });
  });
});
