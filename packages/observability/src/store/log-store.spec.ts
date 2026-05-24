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

function buildLogStore(directory: string, instanceId: string, options: BuildOptions = {}): LogStore {
  return new LogStore(
    options.enabled ?? true,
    directory,
    options.retainedInstances ?? 10,
    instanceId,
  );
}

const tick = () => new Promise(resolve => setTimeout(resolve, 20));

describe("LogStore", () => {
  it("lazy-creates the instance directory and appends a log on first write", () => {
    const directory = makeTempDir();
    const store = buildLogStore(directory, "i1");

    const paths = new ObservabilityPaths(directory);
    expect(fs.existsSync(paths.instanceDirectory("i1"))).toBe(false);

    store.append(new LogModel(SeverityEnum.Info, "hello"));

    expect(fs.existsSync(paths.logsFile("i1"))).toBe(true);
    const entries = store.read("i1");
    expect(entries).toHaveLength(1);
    expect(entries[0].message).toBe("hello");
    expect(entries[0].severity).toBe(SeverityEnum.Info);
  });

  it("is a no-op when capture is disabled", () => {
    const directory = makeTempDir();
    const store = buildLogStore(directory, "i2", {enabled: false});

    expect(store.isCaptureEnabled()).toBe(false);
    store.append(new LogModel(SeverityEnum.Info, "ignored"));

    expect(fs.existsSync(new ObservabilityPaths(directory).instanceDirectory("i2"))).toBe(false);
  });

  it("read() defaults to the most recent instance when none is specified", async () => {
    const directory = makeTempDir();
    const first = buildLogStore(directory, "older");
    first.append(new LogModel(SeverityEnum.Info, "old-message"));
    // Force a measurable mtime gap so the newest-first ordering is unambiguous.
    await tick();
    const second = buildLogStore(directory, "newer");
    second.append(new LogModel(SeverityEnum.Info, "new-message"));

    const reader = buildLogStore(directory, "reader");
    const entries = reader.read();
    expect(entries).toHaveLength(1);
    expect(entries[0].message).toBe("new-message");
  });

  it("prunes oldest instances beyond the retained limit on first write", async () => {
    const directory = makeTempDir();
    const paths = new ObservabilityPaths(directory);
    // Seed three pre-existing instance dirs with measurable mtime gaps.
    for (const name of ["i-a", "i-b", "i-c"]) {
      fs.mkdirSync(paths.instanceDirectory(name), {recursive: true});
      fs.writeFileSync(paths.logsFile(name), "");
      await tick();
    }

    const fresh = buildLogStore(directory, "i-new", {retainedInstances: 2});
    fresh.append(new LogModel(SeverityEnum.Info, "trigger-prune"));

    const remaining = fs.readdirSync(directory).sort();
    expect(remaining).toEqual(["i-c", "i-new"]);
  });

  it("list() returns instance ids newest-first by mtime", async () => {
    const directory = makeTempDir();
    const a = buildLogStore(directory, "a");
    a.append(new LogModel(SeverityEnum.Info, "x"));
    await tick();
    const b = buildLogStore(directory, "b");
    b.append(new LogModel(SeverityEnum.Info, "x"));

    expect(b.list()).toEqual(["b", "a"]);
    expect(b.latestInstanceId()).toBe("b");
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
    const entries = store.read("cycle");
    expect(entries[0].extra.a.label).toBe("a");
    expect(entries[0].extra.a.b.label).toBe("b");
    expect(entries[0].extra.a.b.a).toBe("[Circular]");
  });

  it("tail() emits each newly-appended line until stop()", async () => {
    const directory = makeTempDir();
    const writer = buildLogStore(directory, "tail-instance");
    writer.append(new LogModel(SeverityEnum.Info, "pre-tail"));

    const reader = buildLogStore(directory, "reader");
    const lines: string[] = [];
    const handle = reader.tail("tail-instance", line => lines.push(line));

    writer.append(new LogModel(SeverityEnum.Info, "post-tail"));
    // Give the fs.watch callback a moment to fire.
    await new Promise(resolve => setTimeout(resolve, 200));

    handle.stop();

    expect(lines.length).toBe(1);
    expect(JSON.parse(lines[0]).message).toBe("post-tail");
  });
});
