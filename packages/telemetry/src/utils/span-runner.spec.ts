import "reflect-metadata";
import {SpanRunner, spanRunner} from "./span-runner";
import {Span} from "../models/span.model";
import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";

function buildStubTracingManager(): {tm: TracingManagerInterface; spans: Span[]; ended: Span[]} {
  const spans: Span[] = [];
  const ended: Span[] = [];
  const tm: TracingManagerInterface = {
    trace: undefined,
    startTracing: jest.fn(),
    endTrace: jest.fn(),
    addSpan: jest.fn((span: Span) => span),
    endSpanKeyname: jest.fn(),
    startSpan: jest.fn((keyname: string, _parentKeyname?: string, _parentId?: string, context?: { [key: string]: string }) => {
      const s = new Span(keyname, undefined, context);
      // Wire `end()` so the runner's `span.end()` records the call without needing a real manager.
      s.end = () => { ended.push(s); };
      spans.push(s);
      return s;
    }),
    endSpan: jest.fn((s: Span) => { ended.push(s); }),
  };
  return {tm, spans, ended};
}

describe("SpanRunner.runWithSpan", () => {
  it("starts a span, runs the function, ends the span, and returns the result", async () => {
    const {tm, spans, ended} = buildStubTracingManager();

    const result = await spanRunner.runWithSpan(tm, "my.operation", async () => "ok");

    expect(result).toBe("ok");
    expect(spans).toHaveLength(1);
    expect(spans[0].keyname).toBe("my.operation");
    expect(ended).toEqual([spans[0]]);
  });

  it("works with synchronous functions too", async () => {
    const {tm, ended} = buildStubTracingManager();

    const result = await spanRunner.runWithSpan(tm, "sync.op", () => 42);

    expect(result).toBe(42);
    expect(ended).toHaveLength(1);
  });

  it("ends the span and re-throws on error", async () => {
    const {tm, spans, ended} = buildStubTracingManager();

    await expect(
      spanRunner.runWithSpan(tm, "throws", async () => { throw new Error("boom"); })
    ).rejects.toThrow("boom");

    expect(spans).toHaveLength(1);
    expect(ended).toEqual([spans[0]]);
  });

  it("annotates the span context with the error name and message on throw", async () => {
    const {tm, spans} = buildStubTracingManager();

    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }

    await expect(
      spanRunner.runWithSpan(tm, "annotated", async () => { throw new CustomError("nope"); })
    ).rejects.toThrow();

    expect(spans[0].context).toMatchObject({
      error: "true",
      errorName: "CustomError",
      errorMessage: "nope",
    });
  });

  it("annotates the span context for non-Error throws too", async () => {
    const {tm, spans} = buildStubTracingManager();

    await expect(
      spanRunner.runWithSpan(tm, "non-error-throw", async () => { throw "some string"; })
    ).rejects.toBe("some string");

    expect(spans[0].context).toMatchObject({
      error: "true",
      errorName: "non-error-throw",
      errorMessage: "some string",
    });
  });

  it("forwards parent + context options to startSpan", async () => {
    const {tm} = buildStubTracingManager();

    await spanRunner.runWithSpan(tm, "child", async () => "ok", {
      parentKeyname: "outer",
      parentId: "parent-uuid",
      context: {userId: "abc"},
    });

    expect(tm.startSpan).toHaveBeenCalledWith("child", "outer", "parent-uuid", {userId: "abc"});
  });

  it("preserves any pre-existing context fields when annotating an error", async () => {
    const {tm, spans} = buildStubTracingManager();

    await expect(
      spanRunner.runWithSpan(tm, "preserve", async () => { throw new Error("boom"); }, {
        context: {requestId: "req-1"},
      })
    ).rejects.toThrow();

    expect(spans[0].context).toMatchObject({
      requestId: "req-1",
      error: "true",
      errorName: "Error",
      errorMessage: "boom",
    });
  });

  it("the exported singleton and a fresh instance behave identically", async () => {
    const {tm: tm1} = buildStubTracingManager();
    const {tm: tm2} = buildStubTracingManager();

    const fresh = new SpanRunner();
    const r1 = await spanRunner.runWithSpan(tm1, "via-singleton", () => "a");
    const r2 = await fresh.runWithSpan(tm2, "via-fresh", () => "b");
    expect(r1).toBe("a");
    expect(r2).toBe("b");
  });
});
