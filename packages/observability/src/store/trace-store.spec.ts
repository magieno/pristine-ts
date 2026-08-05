import "reflect-metadata";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {Span, Trace} from "@pristine-ts/common";
import {TraceStore} from "./trace-store";
import {PartitionIndex} from "./partition-index";
import {StoreBudgetEnforcer} from "./store-budget-enforcer";
import {ObservabilityPaths} from "../paths/observability-paths";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pristine-obs-"));
}

interface BuildOptions {
  enabled?: boolean;
  retainedInstances?: number;
  maxTraceFiles?: number;
  maxTraceFileSize?: number;
  maxLogFileSize?: number;
  maxLogFiles?: number;
  maxStoreSize?: number;
  maxRetentionAge?: number;
}

function buildTraceStore(directory: string, partitionId: string, options: BuildOptions = {}): TraceStore {
  const partitions = new PartitionIndex(directory, partitionId);
  const budget = new StoreBudgetEnforcer(
    options.maxStoreSize ?? 100 * 1024 * 1024,
    options.maxRetentionAge ?? 0,
    options.retainedInstances ?? 10,
    options.maxLogFiles ?? 3,
    partitions,
  );
  return new TraceStore(
    options.enabled ?? true,
    options.maxTraceFiles ?? 500,
    options.maxTraceFileSize ?? 1024 * 1024,
    options.maxLogFileSize ?? 10 * 1024 * 1024,
    options.maxLogFiles ?? 3,
    partitions,
    budget,
  );
}

function makeTrace(id: string, contextOverrides: Record<string, string> = {}): Trace {
  const trace = new Trace(id, {
    "http.method": "GET",
    "http.path": "/products",
    "http.statusCode": "200",
    ...contextOverrides,
  });
  trace.startDate = 1000;
  trace.endDate = 1042;
  trace.rootSpan = new Span("root.execution", "span-root");
  trace.rootSpan.startDate = 1000;
  trace.rootSpan.endDate = 1042;
  return trace;
}

const tick = () => new Promise(resolve => setTimeout(resolve, 20));

describe("TraceStore", () => {
  it("writes the trace JSON and appends a one-id summary on append", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "p1");

    store.append(makeTrace("event-1"));

    const paths = new ObservabilityPaths(directory);
    expect(fs.existsSync(paths.traceFile("p1", "event-1"))).toBe(true);
    expect(fs.existsSync(paths.requestsFile("p1"))).toBe(true);

    const summaries = store.recentRequests();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].eventId).toBe("event-1");
    // Common case: trace/request ids equal event id, so the summary omits them.
    expect(summaries[0].traceId).toBeUndefined();
    expect(summaries[0].requestId).toBeUndefined();
    expect(summaries[0].httpMethod).toBe("GET");
    expect(summaries[0].httpStatus).toBe(200);
    expect(summaries[0].durationMs).toBe(42);
  });

  it("writes divergent traceId only when it differs from eventId", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "p-divergent-trace");
    const trace = makeTrace("trace-from-upstream", {"event.id": "event-local"});

    store.append(trace);

    const summary = store.recentRequests()[0];
    expect(summary.eventId).toBe("event-local");
    expect(summary.traceId).toBe("trace-from-upstream");
    expect(summary.requestId).toBeUndefined();
  });

  it("writes divergent requestId only when it differs from eventId", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "p-divergent-request");
    const trace = makeTrace("event-1", {"request.id": "client-xyz-99"});

    store.append(trace);

    const summary = store.recentRequests()[0];
    expect(summary.eventId).toBe("event-1");
    expect(summary.requestId).toBe("client-xyz-99");
    expect(summary.traceId).toBeUndefined();
  });

  it("is a no-op when capture is disabled", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "p2", {enabled: false});

    store.append(makeTrace("event-x"));

    expect(fs.existsSync(new ObservabilityPaths(directory).instanceDirectory("p2"))).toBe(false);
  });

  it("find(id) resolves by eventId (direct file lookup)", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "p-find");
    store.append(makeTrace("event-direct"));

    const found = store.find("event-direct");
    expect(found).toBeDefined();
    expect(found!.eventId).toBe("event-direct");
    expect(found!.trace).toBeInstanceOf(Trace);
    expect(found!.trace.getDuration()).toBe(42);
    expect(found!.trace.rootSpan).toBeInstanceOf(Span);
  });

  it("find(id) resolves by divergent requestId via the summary index", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "p-find-request");
    store.append(makeTrace("event-canonical", {"request.id": "client-id-77"}));

    const found = store.find("client-id-77");
    expect(found).toBeDefined();
    expect(found!.eventId).toBe("event-canonical");
  });

  it("find(id) resolves by divergent traceId via the summary index", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "p-find-trace");
    store.append(makeTrace("trace-upstream", {"event.id": "event-local"}));

    const found = store.find("trace-upstream");
    expect(found).toBeDefined();
    expect(found!.eventId).toBe("event-local");
  });

  it("find(id) returns undefined when no partition has the id", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "p-empty");
    store.append(makeTrace("event-a"));

    expect(store.find("nonexistent")).toBeUndefined();
  });

  it("findSerialized() returns the raw stored JSON shape", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "p-serialized");
    store.append(makeTrace("event-serialized"));

    const found = store.findSerialized("event-serialized");
    expect(found).toBeDefined();
    expect(found!.eventId).toBe("event-serialized");
    expect(found!.trace.id).toBe("event-serialized");
    expect(found!.trace.rootSpan?.keyname).toBe("root.execution");
  });

  it("find searches partitions newest-first", async () => {
    const directory = makeTempDir();
    const older = buildTraceStore(directory, "older");
    older.append(makeTrace("only-in-older"));
    await tick();
    const newer = buildTraceStore(directory, "newer");
    newer.append(makeTrace("only-in-newer"));

    const reader = buildTraceStore(directory, "reader");
    expect(reader.find("only-in-older")).toBeDefined();
    expect(reader.find("only-in-newer")).toBeDefined();
  });

  it("recentRequests() returns summaries across every partition, newest first", async () => {
    const directory = makeTempDir();
    const older = buildTraceStore(directory, "older");
    const tOld = makeTrace("t-old");
    tOld.startDate = 1000;
    tOld.endDate = 1010;
    older.append(tOld);
    await tick();
    const newer = buildTraceStore(directory, "newer");
    const tMid = makeTrace("t-mid");
    tMid.startDate = 2000;
    tMid.endDate = 2010;
    const tNew = makeTrace("t-new");
    tNew.startDate = 3000;
    tNew.endDate = 3010;
    newer.append(tMid);
    newer.append(tNew);

    const reader = buildTraceStore(directory, "reader");
    const summaries = reader.recentRequests();
    expect(summaries.map(s => s.eventId)).toEqual(["t-new", "t-mid", "t-old"]);

    expect(reader.recentRequests(2).map(s => s.eventId)).toEqual(["t-new", "t-mid"]);
  });

  it("recentTraceIds() returns event ids across all partitions, newest first", async () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "p-recent");
    const tA = makeTrace("a");
    tA.startDate = 1000;
    tA.endDate = 1050;
    const tB = makeTrace("b");
    tB.startDate = 2000;
    tB.endDate = 2050;
    store.append(tA);
    store.append(tB);

    expect(store.recentTraceIds(5)).toEqual(["b", "a"]);
  });

  it("prunes oldest partitions beyond the retained limit on first write", async () => {
    const directory = makeTempDir();
    const paths = new ObservabilityPaths(directory);
    for (const name of ["t-a", "t-b", "t-c"]) {
      fs.mkdirSync(paths.tracesDirectory(name), {recursive: true});
      fs.writeFileSync(paths.requestsFile(name), "");
      await tick();
    }

    const fresh = buildTraceStore(directory, "t-new", {retainedInstances: 2});
    fresh.append(makeTrace("trigger"));

    const remaining = fs.readdirSync(directory).sort();
    expect(remaining).toEqual(["t-c", "t-new"]);
  });

  describe("retention", () => {
    it("keeps at most maxTraceFiles trace files per partition, evicting the oldest", () => {
      const directory = makeTempDir();
      const store = buildTraceStore(directory, "t-cap", {maxTraceFiles: 3});
      const tracesDirectory = new ObservabilityPaths(directory).tracesDirectory("t-cap");

      for (let index = 0; index < 10; index++) {
        store.append(makeTrace(`event-${index}`));
      }

      const files = fs.readdirSync(tracesDirectory).sort();
      expect(files).toEqual(["event-7.json", "event-8.json", "event-9.json"]);
      // The summary index is untouched by trace-file eviction: every request is still listed.
      expect(store.recentRequests()).toHaveLength(10);
      expect(store.find("event-0")).toBeUndefined();
      expect(store.find("event-9")).toBeDefined();
    });

    it("skips a trace tree larger than maxTraceFileSize but still indexes the request", () => {
      const directory = makeTempDir();
      const store = buildTraceStore(directory, "t-oversized", {maxTraceFileSize: 64});

      store.append(makeTrace("event-oversized"));

      const paths = new ObservabilityPaths(directory);
      expect(fs.existsSync(paths.traceFile("t-oversized", "event-oversized"))).toBe(false);

      const summary = store.recentRequests()[0];
      expect(summary.eventId).toBe("event-oversized");
      expect(summary.traceOmitted).toBe(true);
    });

    it("rotates requests.jsonl and still reads summaries across generations", () => {
      const directory = makeTempDir();
      const store = buildTraceStore(directory, "t-rotate", {maxLogFileSize: 300, maxLogFiles: 3});
      const requestsFile = new ObservabilityPaths(directory).requestsFile("t-rotate");

      for (let index = 0; index < 12; index++) {
        const trace = makeTrace(`event-${index}`);
        trace.startDate = 1000 + index;
        trace.endDate = trace.startDate + 5;
        store.append(trace);
      }

      expect(fs.existsSync(ObservabilityPaths.rotated(requestsFile, 1))).toBe(true);

      const summaries = store.recentRequests();
      expect(summaries.length).toBeGreaterThan(1);
      expect(summaries[0].eventId).toBe("event-11");
      // Newest first, with no duplicates across generations.
      expect(new Set(summaries.map(summary => summary.eventId)).size).toBe(summaries.length);
    });

    it("finds a trace whose summary lives in a rotated generation", () => {
      const directory = makeTempDir();
      const store = buildTraceStore(directory, "t-rotate-find", {maxLogFileSize: 300, maxLogFiles: 3});
      const requestsFile = new ObservabilityPaths(directory).requestsFile("t-rotate-find");

      for (let index = 0; index < 12; index++) {
        const trace = makeTrace(`event-${index}`, {"request.id": `client-${index}`});
        trace.startDate = 1000 + index;
        trace.endDate = trace.startDate + 5;
        store.append(trace);
      }

      // The oldest summary that survived rotation is, by construction, not in the live
      // file — resolving it proves the index lookup spans generations.
      const summaries = store.recentRequests();
      const oldest = summaries[summaries.length - 1];
      expect(fs.readFileSync(requestsFile, "utf8")).not.toContain(oldest.eventId);

      const found = store.find(oldest.requestId!);
      expect(found).toBeDefined();
      expect(found!.eventId).toBe(oldest.eventId);
    });
  });
});
