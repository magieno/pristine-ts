import "reflect-metadata";
import {EventContext, EventContextManager} from "@pristine-ts/common";
import {Span} from "../models/span.model";
import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";
import {traced} from "./traced.decorator";

function buildStubTracingManager(): {tm: TracingManagerInterface; spans: Span[]; ended: Span[]} {
  const spans: Span[] = [];
  const ended: Span[] = [];
  const tm: TracingManagerInterface = {
    trace: undefined,
    startTracing: jest.fn(),
    endTrace: jest.fn(),
    addSpan: jest.fn((s: Span) => s),
    endSpanKeyname: jest.fn(),
    startSpan: jest.fn((keyname: string, _pk?: string, _pid?: string, context?: { [key: string]: string }) => {
      const s = new Span(keyname, undefined, context);
      s.end = () => { ended.push(s); };
      spans.push(s);
      return s;
    }),
    endSpan: jest.fn((s: Span) => { ended.push(s); }),
    addEventToCurrentSpan: jest.fn(),
  };
  return {tm, spans, ended};
}

function buildContextWithTracing(tm: TracingManagerInterface, eventId = "evt"): {ecm: EventContextManager; ctx: EventContext} {
  const ecm = new EventContextManager();
  const ctx = new EventContext();
  ctx.eventId = eventId;
  ctx.container = {resolve: () => tm} as any;
  return {ecm, ctx};
}

describe("@traced", () => {
  it("wraps a method in a span named ClassName.methodName by default", async () => {
    const {tm, spans} = buildStubTracingManager();
    const {ecm, ctx} = buildContextWithTracing(tm);

    class Service {
      @traced()
      async work(n: number): Promise<number> {
        return n + 1;
      }
    }

    const svc = new Service();
    const result = await ecm.run(ctx, () => svc.work(41));

    expect(result).toBe(42);
    expect(spans).toHaveLength(1);
    expect(spans[0].keyname).toBe("Service.work");
  });

  it("honors an explicit span name", async () => {
    const {tm, spans} = buildStubTracingManager();
    const {ecm, ctx} = buildContextWithTracing(tm);

    class Service {
      @traced("custom.span.name")
      async work(): Promise<string> {
        return "done";
      }
    }

    await ecm.run(ctx, () => new Service().work());
    expect(spans[0].keyname).toBe("custom.span.name");
  });

  it("nests spans when a traced method calls another traced method", async () => {
    const {tm, spans} = buildStubTracingManager();
    const {ecm, ctx} = buildContextWithTracing(tm);

    class Service {
      @traced()
      async outer(): Promise<string> {
        return this.inner();
      }
      @traced()
      async inner(): Promise<string> {
        return "leaf";
      }
    }

    await ecm.run(ctx, () => new Service().outer());

    expect(spans).toHaveLength(2);
    expect(spans.map(s => s.keyname).sort()).toEqual(["Service.inner", "Service.outer"]);
  });

  it("re-throws errors and annotates the span context", async () => {
    const {tm, spans} = buildStubTracingManager();
    const {ecm, ctx} = buildContextWithTracing(tm);

    class Service {
      @traced()
      async fail(): Promise<void> {
        throw new Error("boom");
      }
    }

    await expect(ecm.run(ctx, () => new Service().fail())).rejects.toThrow("boom");
    expect(spans[0].context).toMatchObject({
      error: "true",
      errorName: "Error",
      errorMessage: "boom",
    });
  });

  it("no-ops gracefully when called outside any EventContext", async () => {
    class Service {
      @traced()
      async work(): Promise<string> {
        return "ran";
      }
    }

    const result = await new Service().work();
    expect(result).toBe("ran");
  });

  it("no-ops when the container has no TracingManager registered", async () => {
    const ecm = new EventContextManager();
    const ctx = new EventContext();
    ctx.eventId = "evt-nope";
    ctx.container = {resolve: () => { throw new Error("not registered"); }} as any;

    class Service {
      @traced()
      async work(): Promise<string> {
        return "still-ran";
      }
    }

    const result = await ecm.run(ctx, () => new Service().work());
    expect(result).toBe("still-ran");
  });

  it("preserves `this` inside the method body", async () => {
    const {tm} = buildStubTracingManager();
    const {ecm, ctx} = buildContextWithTracing(tm);

    class Service {
      readonly multiplier = 3;
      @traced()
      async compute(n: number): Promise<number> {
        return n * this.multiplier;
      }
    }

    const result = await ecm.run(ctx, () => new Service().compute(7));
    expect(result).toBe(21);
  });
});
