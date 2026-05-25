import "reflect-metadata";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {LogModel, SeverityEnum} from "@pristine-ts/logging";
import {LogStore} from "./log-store";
import {ObservabilityPaths} from "../paths/observability-paths";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pristine-obs-"));
}

interface BuildOptions {
  enabled?: boolean;
  retainedInstances?: number;
}

function buildLogStore(directory: string, partitionId: string, options: BuildOptions = {}): LogStore {
  return new LogStore(
    options.enabled ?? true,
    directory,
    options.retainedInstances ?? 10,
    partitionId,
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
});
