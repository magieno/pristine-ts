import "reflect-metadata";
import {ConsoleTracer} from "./console.tracer";
import {ConsoleTracerOutputModeEnum} from "../enums/console-tracer-output-mode.enum";
import {Trace} from "../models/trace.model";
import {Span} from "../models/span.model";

function buildTracer(opts: {
  activated: boolean;
  outputMode: ConsoleTracerOutputModeEnum;
  minimumDurationMs?: number;
}): {tracer: ConsoleTracer; logHandler: any} {
  const logHandler = {error: jest.fn(), warning: jest.fn(), info: jest.fn(), debug: jest.fn(), critical: jest.fn(), notice: jest.fn(), terminate: jest.fn()};
  const tracer = new ConsoleTracer(
    opts.activated,
    opts.outputMode,
    opts.minimumDurationMs ?? 0,
    logHandler as any,
  );
  return {tracer, logHandler};
}

function buildTrace(): Trace {
  // Construct a small trace by hand. Pin start/end dates so duration assertions are stable.
  const trace = new Trace("trace-1");
  trace.startDate = 1000;
  trace.endDate = 1450;

  const root = new Span("root.execution", "span-root");
  root.startDate = 1000;
  root.endDate = 1450;
  trace.rootSpan = root;

  const a = new Span("phase.a", "span-a");
  a.startDate = 1000;
  a.endDate = 1010;
  root.addChild(a);

  const b = new Span("phase.b", "span-b");
  b.startDate = 1010;
  b.endDate = 1450;
  root.addChild(b);

  const b1 = new Span("phase.b.long", "span-b1");
  b1.startDate = 1010;
  b1.endDate = 1400;  // slowest leaf
  b.addChild(b1);

  const b2 = new Span("phase.b.short", "span-b2");
  b2.startDate = 1400;
  b2.endDate = 1450;
  b.addChild(b2);

  return trace;
}

describe("ConsoleTracer", () => {
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it("does nothing when deactivated", () => {
    const {tracer} = buildTracer({activated: false, outputMode: ConsoleTracerOutputModeEnum.Tree});
    tracer.traceEndedStream?.emit("data", buildTrace());
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it("renders a tree with hierarchy and durations when activated", () => {
    const {tracer} = buildTracer({activated: true, outputMode: ConsoleTracerOutputModeEnum.Tree});
    tracer.traceEndedStream?.emit("data", buildTrace());
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const out = stdoutSpy.mock.calls[0][0] as string;

    expect(out).toContain("Trace trace-1 — 450ms");
    expect(out).toContain("root.execution");
    expect(out).toContain("phase.a");
    expect(out).toContain("phase.b");
    expect(out).toContain("phase.b.long");
    // 390ms is the slowest single span (b.long); should be tagged.
    expect(out).toMatch(/phase\.b\.long.*390ms.*← bottleneck/);
    // Tree characters present.
    expect(out).toContain("├──");
    expect(out).toContain("└──");
  });

  it("renders flat output as one line per span sorted by start time", () => {
    const {tracer} = buildTracer({activated: true, outputMode: ConsoleTracerOutputModeEnum.Flat});
    tracer.traceEndedStream?.emit("data", buildTrace());
    const out = stdoutSpy.mock.calls[0][0] as string;
    const lines = out.split("\n").filter(l => l.trim().length > 0);

    expect(lines[0]).toContain("Trace trace-1");
    // Spans appear in start-date order: root(1000) > a(1000) > b(1010) > b1(1010) > b2(1400).
    // (root and a tie on start; either order is acceptable. We just verify all five appear.)
    expect(out).toContain("root.execution");
    expect(out).toContain("phase.a");
    expect(out).toContain("phase.b");
    expect(out).toContain("phase.b.long");
    expect(out).toContain("phase.b.short");
  });

  it("renders JSON output that round-trips with all spans", () => {
    const {tracer} = buildTracer({activated: true, outputMode: ConsoleTracerOutputModeEnum.Json});
    tracer.traceEndedStream?.emit("data", buildTrace());
    const out = stdoutSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(out);

    expect(parsed.id).toBe("trace-1");
    expect(parsed.duration).toBe(450);
    expect(parsed.rootSpan.keyname).toBe("root.execution");
    expect(parsed.rootSpan.children).toHaveLength(2);
    expect(parsed.rootSpan.children[1].children).toHaveLength(2);
  });

  it("skips traces shorter than minimumDurationMs", () => {
    const {tracer} = buildTracer({
      activated: true,
      outputMode: ConsoleTracerOutputModeEnum.Tree,
      minimumDurationMs: 1000,  // trace is 450ms — below the threshold
    });
    tracer.traceEndedStream?.emit("data", buildTrace());
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it("absorbs a thrown error inside the data handler instead of crashing", () => {
    const {tracer} = buildTracer({activated: true, outputMode: ConsoleTracerOutputModeEnum.Tree});
    const stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    try {
      // Build a trace whose rootSpan throws when its children are walked.
      const broken = buildTrace();
      Object.defineProperty(broken.rootSpan!, "children", {
        get() { throw new Error("boom"); },
      });
      expect(() => tracer.traceEndedStream?.emit("data", broken)).not.toThrow();
      expect(stderrSpy).toHaveBeenCalled();
      const stderrOut = stderrSpy.mock.calls[0][0] as string;
      expect(stderrOut).toContain("[pristine][tracer:ConsoleTracer]");
      expect(stderrOut).toContain("boom");
    } finally {
      stderrSpy.mockRestore();
    }
  });
});
