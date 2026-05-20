import "reflect-metadata";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {Span, Trace} from "@pristine-ts/common";
import {LogModel, SeverityEnum} from "@pristine-ts/logging";
import {ObservabilityConfiguration} from "../observability-configuration";
import {ObservabilityPaths} from "./observability-paths";
import {ObservabilityRunManager} from "./observability-run-manager";
import {ObservabilityStoreReader} from "./observability-store-reader";
import {SerializedTrace, TraceDeserializer} from "./trace-deserializer";
import {ObservabilityLogger} from "../loggers/observability.logger";
import {ObservabilityTracer} from "../tracers/observability.tracer";

const tick = () => new Promise(resolve => setTimeout(resolve, 50));

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pristine-obs-"));
}

/**
 * Builds an `ObservabilityConfiguration` pointed at a temp directory for tests.
 */
function config(directory: string, overrides: Partial<ObservabilityConfiguration> = {}): ObservabilityConfiguration {
  return {
    enabled: true,
    directory,
    retainedRuns: 10,
    autoBegin: false,
    maxRunSizeBytes: 100 * 1024 * 1024,
    ...overrides,
  } as ObservabilityConfiguration;
}

describe("ObservabilityPaths", () => {
  it("resolves the store layout from the configured directory", () => {
    const paths = new ObservabilityPaths("/tmp/store");
    expect(paths.root).toBe("/tmp/store");
    expect(paths.runDirectory("r1")).toBe("/tmp/store/runs/r1");
    expect(paths.logsFile("r1")).toBe("/tmp/store/runs/r1/logs.jsonl");
    expect(paths.requestsFile("r1")).toBe("/tmp/store/runs/r1/requests.jsonl");
    expect(paths.traceFile("r1", "t1")).toBe("/tmp/store/runs/r1/traces/t1.json");
    expect(paths.latestPointerFile()).toBe("/tmp/store/latest.json");
  });
});

describe("ObservabilityRunManager", () => {
  it("creates the run directory, run.json and latest.json on beginRun", () => {
    const directory = makeTempDir();
    const manager = new ObservabilityRunManager(config(directory), "run-a");

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
    const manager = new ObservabilityRunManager(config(directory, {enabled: false}), "run-x");
    manager.beginRun("start");
    expect(manager.isRunActive()).toBe(false);
    expect(manager.logsFile()).toBeUndefined();
  });

  it("prunes runs beyond the retained limit", () => {
    const directory = makeTempDir();
    const paths = new ObservabilityPaths(directory);
    // Pre-seed three older runs.
    for (const [name, startedAt] of [["old1", 1], ["old2", 2], ["old3", 3]] as const) {
      fs.mkdirSync(paths.runDirectory(name), {recursive: true});
      fs.writeFileSync(paths.runMetadataFile(name), JSON.stringify({runId: name, startedAt: new Date(startedAt).toISOString()}));
    }

    new ObservabilityRunManager(config(directory, {retainedRuns: 2}), "run-new").beginRun("start");

    const remaining = fs.readdirSync(paths.runsDirectory()).sort();
    expect(remaining).toEqual(["old3", "run-new"]);
  });

  it("auto-begins a run on first store access when autoBegin is enabled", () => {
    const directory = makeTempDir();
    const manager = new ObservabilityRunManager(config(directory, {autoBegin: true}), "run-auto");

    expect(manager.isRunActive()).toBe(false);
    expect(manager.logsFile()).toBeDefined(); // first access triggers the auto-begin
    expect(manager.isRunActive()).toBe(true);
  });

  it("does not auto-begin when autoBegin is disabled", () => {
    const directory = makeTempDir();
    const manager = new ObservabilityRunManager(config(directory), "run-noauto");

    expect(manager.logsFile()).toBeUndefined();
    expect(manager.isRunActive()).toBe(false);
  });
});

describe("ObservabilityLogger + ObservabilityTracer + ObservabilityStoreReader", () => {
  it("writes logs, traces and the request index, then reads them back", async () => {
    const directory = makeTempDir();
    const runManager = new ObservabilityRunManager(config(directory), "run-rw");
    runManager.beginRun("start");

    const logger = new ObservabilityLogger(config(directory), runManager);
    const log = new LogModel(SeverityEnum.Info, "request received");
    log.traceId = "trace-1";
    log.eventId = "trace-1";
    logger.readableStream!.push(log);

    const tracer = new ObservabilityTracer(config(directory), runManager);
    const trace = new Trace("trace-1", {"http.method": "GET", "http.path": "/products", "http.statusCode": "200"});
    trace.startDate = 1000;
    trace.endDate = 1042;
    trace.rootSpan = new Span("root.execution", "span-root");
    trace.rootSpan.startDate = 1000;
    trace.rootSpan.endDate = 1042;
    tracer.traceEndedStream.push(trace);

    await tick();

    const reader = new ObservabilityStoreReader(config(directory));
    expect(reader.latestRunId()).toBe("run-rw");

    const logs = reader.readLogs("run-rw");
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe("request received");
    expect(logs[0].severity).toBe(SeverityEnum.Info);

    const requests = reader.readRequests("run-rw");
    expect(requests).toHaveLength(1);
    expect(requests[0].traceId).toBe("trace-1");
    expect(requests[0].httpMethod).toBe("GET");
    expect(requests[0].httpPath).toBe("/products");
    expect(requests[0].httpStatus).toBe(200);
    expect(requests[0].durationMs).toBe(42);

    const found = reader.findTrace("trace-1");
    expect(found).toBeDefined();
    expect(found!.trace.id).toBe("trace-1");
    expect(found!.trace.rootSpan?.keyname).toBe("root.execution");
  });

  it("enforces the per-run size budget by dropping the oldest logs", async () => {
    const directory = makeTempDir();
    const runManager = new ObservabilityRunManager(config(directory, {maxRunSizeBytes: 4000}), "run-budget");
    runManager.beginRun("start");

    const logger = new ObservabilityLogger(config(directory, {maxRunSizeBytes: 4000}), runManager);
    for (let i = 0; i < 300; i++) {
      logger.readableStream!.push(new LogModel(SeverityEnum.Info, `message ${i}`));
    }
    await tick();

    const logs = new ObservabilityStoreReader(config(directory)).readLogs("run-budget");
    // The run stayed bounded — far fewer than the 300 written entries survived...
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.length).toBeLessThan(300);
    // ...and it kept the newest, not the oldest.
    expect(logs[logs.length - 1].message).toBe("message 299");
    expect(logs[0].message).not.toBe("message 0");
  });

  it("the logger and tracer are dormant before a run begins", async () => {
    const directory = makeTempDir();
    const runManager = new ObservabilityRunManager(config(directory), "run-dormant");

    const logger = new ObservabilityLogger(config(directory), runManager);
    logger.readableStream!.push(new LogModel(SeverityEnum.Info, "noise"));
    await tick();

    expect(fs.existsSync(new ObservabilityPaths(directory).runsDirectory())).toBe(false);
  });
});

describe("TraceDeserializer", () => {
  it("rehydrates a stored trace into Trace/Span instances", () => {
    const serialized: SerializedTrace = {
      id: "trace-9",
      startDate: 100,
      endDate: 250,
      context: {"http.method": "POST"},
      rootSpan: {
        id: "s0",
        keyname: "root.execution",
        startDate: 100,
        endDate: 250,
        context: {},
        children: [
          {id: "s1", keyname: "router.request.execution", startDate: 110, endDate: 240, context: {}, children: []},
        ],
      },
    };

    const trace = TraceDeserializer.deserialize(serialized);
    expect(trace).toBeInstanceOf(Trace);
    expect(trace.id).toBe("trace-9");
    expect(trace.getDuration()).toBe(150);
    expect(trace.rootSpan).toBeInstanceOf(Span);
    expect(trace.rootSpan!.children).toHaveLength(1);
    expect(trace.rootSpan!.children[0].keyname).toBe("router.request.execution");
    expect(trace.rootSpan!.children[0].getDuration()).toBe(130);
  });
});
