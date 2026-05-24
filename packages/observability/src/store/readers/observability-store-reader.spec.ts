import "reflect-metadata";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {Span, Trace} from "@pristine-ts/common";
import {LogModel, SeverityEnum} from "@pristine-ts/logging";
import {ObservabilityPaths} from "../utils/observability-paths";
import {ObservabilityRunManager} from "../managers/observability-run-manager";
import {ObservabilityStoreReader} from "./observability-store-reader";
import {ObservabilityLogger} from "../../loggers/observability.logger";
import {ObservabilityTracer} from "../../tracers/observability.tracer";

const tick = () => new Promise(resolve => setTimeout(resolve, 50));

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

describe("ObservabilityLogger + ObservabilityTracer + ObservabilityStoreReader", () => {
  it("writes logs, traces and the request index, then reads them back", async () => {
    const directory = makeTempDir();
    const runManager = buildRunManager(directory, "run-rw");
    runManager.beginRun("start");

    const logger = new ObservabilityLogger(runManager);
    const log = new LogModel(SeverityEnum.Info, "request received");
    log.traceId = "trace-1";
    log.eventId = "trace-1";
    logger.readableStream!.push(log);

    const tracer = new ObservabilityTracer(runManager);
    const trace = new Trace("trace-1", {"http.method": "GET", "http.path": "/products", "http.statusCode": "200"});
    trace.startDate = 1000;
    trace.endDate = 1042;
    trace.rootSpan = new Span("root.execution", "span-root");
    trace.rootSpan.startDate = 1000;
    trace.rootSpan.endDate = 1042;
    tracer.traceEndedStream.push(trace);

    await tick();

    const reader = new ObservabilityStoreReader(directory);
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
    const runManager = buildRunManager(directory, "run-budget", {maxRunSizeBytes: 4000});
    runManager.beginRun("start");

    const logger = new ObservabilityLogger(runManager);
    for (let i = 0; i < 300; i++) {
      logger.readableStream!.push(new LogModel(SeverityEnum.Info, `message ${i}`));
    }
    await tick();

    const logs = new ObservabilityStoreReader(directory).readLogs("run-budget");
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.length).toBeLessThan(300);
    expect(logs[logs.length - 1].message).toBe("message 299");
    expect(logs[0].message).not.toBe("message 0");
  });

  it("the logger and tracer are dormant before a run begins", async () => {
    const directory = makeTempDir();
    const runManager = buildRunManager(directory, "run-dormant");

    const logger = new ObservabilityLogger(runManager);
    logger.readableStream!.push(new LogModel(SeverityEnum.Info, "noise"));
    await tick();

    expect(fs.existsSync(new ObservabilityPaths(directory).runsDirectory())).toBe(false);
  });
});
