import "reflect-metadata";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {Span, Trace} from "@pristine-ts/common";
import {TraceStore} from "./trace-store";
import {ObservabilityPaths} from "../paths/observability-paths";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pristine-obs-"));
}

interface BuildOptions {
  enabled?: boolean;
  retainedInstances?: number;
}

function buildTraceStore(directory: string, instanceId: string, options: BuildOptions = {}): TraceStore {
  return new TraceStore(
    options.enabled ?? true,
    directory,
    options.retainedInstances ?? 10,
    instanceId,
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
  it("writes the trace JSON and appends a request summary on append", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "i1");

    store.append(makeTrace("trace-1"));

    const paths = new ObservabilityPaths(directory);
    expect(fs.existsSync(paths.traceFile("i1", "trace-1"))).toBe(true);
    expect(fs.existsSync(paths.requestsFile("i1"))).toBe(true);

    const summaries = store.recentRequests("i1");
    expect(summaries).toHaveLength(1);
    expect(summaries[0].traceId).toBe("trace-1");
    expect(summaries[0].httpMethod).toBe("GET");
    expect(summaries[0].httpPath).toBe("/products");
    expect(summaries[0].httpStatus).toBe(200);
    expect(summaries[0].durationMs).toBe(42);
  });

  it("is a no-op when capture is disabled", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "i2", {enabled: false});

    store.append(makeTrace("trace-x"));

    expect(fs.existsSync(new ObservabilityPaths(directory).instanceDirectory("i2"))).toBe(false);
  });

  it("find() returns a rehydrated Trace instance, not a serialized object", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "i3");
    store.append(makeTrace("trace-rehydrate"));

    const found = store.find("trace-rehydrate");
    expect(found).toBeDefined();
    expect(found!.trace).toBeInstanceOf(Trace);
    expect(found!.trace.getDuration()).toBe(42);
    expect(found!.trace.rootSpan).toBeInstanceOf(Span);
  });

  it("findSerialized() returns the raw stored JSON shape", () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "i4");
    store.append(makeTrace("trace-serialized"));

    const found = store.findSerialized("trace-serialized");
    expect(found).toBeDefined();
    expect(found!.trace.id).toBe("trace-serialized");
    expect(found!.trace.rootSpan?.keyname).toBe("root.execution");
  });

  it("find() searches the preferred instance first, then everything else newest-first", async () => {
    const directory = makeTempDir();
    const older = buildTraceStore(directory, "older");
    older.append(makeTrace("only-in-older"));
    await tick();
    const newer = buildTraceStore(directory, "newer");
    newer.append(makeTrace("only-in-newer"));

    const reader = buildTraceStore(directory, "reader");
    expect(reader.find("only-in-older")!.instanceId).toBe("older");
    expect(reader.find("only-in-newer")!.instanceId).toBe("newer");
    // Preferred-but-missing falls back to other instances.
    expect(reader.find("only-in-older", "newer")!.instanceId).toBe("older");
  });

  it("recentRequests() defaults to the latest instance and respects the limit", async () => {
    const directory = makeTempDir();
    const older = buildTraceStore(directory, "older");
    older.append(makeTrace("t-1"));
    await tick();
    const newer = buildTraceStore(directory, "newer");
    const trace2 = makeTrace("t-2");
    trace2.startDate = 2000;
    trace2.endDate = 2050;
    const trace3 = makeTrace("t-3");
    trace3.startDate = 3000;
    trace3.endDate = 3050;
    newer.append(trace2);
    newer.append(trace3);

    const reader = buildTraceStore(directory, "reader");
    const summaries = reader.recentRequests();
    expect(summaries).toHaveLength(2);
    expect(summaries[0].traceId).toBe("t-3");
    expect(summaries[1].traceId).toBe("t-2");

    expect(reader.recentRequests(undefined, 1)).toHaveLength(1);
  });

  it("recentTraceIds() returns ids from the latest instance, newest first", async () => {
    const directory = makeTempDir();
    const store = buildTraceStore(directory, "i5");
    const traceA = makeTrace("a");
    traceA.startDate = 1000;
    traceA.endDate = 1050;
    const traceB = makeTrace("b");
    traceB.startDate = 2000;
    traceB.endDate = 2050;
    store.append(traceA);
    store.append(traceB);

    expect(store.recentTraceIds(5)).toEqual(["b", "a"]);
  });

  it("prunes oldest instances beyond the retained limit on first write", async () => {
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
});
