import "reflect-metadata";
import {TracingManager} from "./tracing.manager";
import {SpanKeynameEnum} from "../enums/span-keyname.enum";
import {TracerInterface} from "../interfaces/tracer.interface";
import {Readable} from "stream";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {TracingContext} from "@pristine-ts/common";
import {Span} from "../models/span.model";
import {Trace} from "../models/trace.model";

const logHandlerMock: LogHandlerInterface = {
  critical(message: string, extra?: any): void {
  }, debug(message: string, extra?: any): void {
  }, error(message: string, extra?: any): void {
  }, info(message: string, extra?: any): void {
  }, notice(message: string, extra?: any): void {
  }, warning(message: string, extra?: any): void {
  }, terminate() {
  }
}

class TracerMock implements TracerInterface {
  spanStartedStream: Readable;
  spanEndedStream: Readable;
  traceStartedStream: Readable;
  traceEndedStream: Readable;

  constructor() {
    this.spanStartedStream = new Readable({
      objectMode: true,
      read(size: number) {
        return true;
      }
    });

    this.spanStartedStream.on('data', (span: Span) => {
      this.spanStarted(span);
    });
    this.spanEndedStream = new Readable({
      objectMode: true,
      read(size: number) {
        return true;
      }
    });

    this.spanEndedStream.on('data', (span: Span) => {
      this.spanEnded(span);
    });

    this.traceStartedStream = new Readable({
      objectMode: true,
      read(size: number) {
        return true;
      }
    });

    this.traceStartedStream.on('data', (trace: Trace) => {
      this.traceStarted(trace);
    });

    this.traceEndedStream = new Readable({
      objectMode: true,
      read(size: number) {
        return true;
      }
    });

    this.traceEndedStream.on('data', (trace: Trace) => {
      this.traceEnded(trace);
    });
    this.traceEndedStream = new Readable({
      objectMode: true,
      read(size: number) {
        return true;
      }
    });

    this.traceEndedStream.on('data', (trace: Trace) => {
      this.traceEnded(trace);
    });
  }

  spanStarted(span: Span) {

  }

  spanEnded(span: Span) {

  }

  traceStarted(trace: Trace) {

  }

  traceEnded(trace: Trace) {

  }

}

describe("Tracing Manager", () => {
  it("should start the tracing by creating the trace and the root span", () => {
    const tracingManager: TracingManager = new TracingManager([], logHandlerMock, true, false, new TracingContext());

    tracingManager.startTracing();

    expect(tracingManager.trace).toBeDefined();
    expect(tracingManager.trace!.spansByKeyname[SpanKeynameEnum.RootExecution]).toBeDefined();
  })

  it("should call the tracers when the startSpan method is called", async () => {
    let i = 0;

    return new Promise<void>(resolve => {

      // @ts-ignore
      const tracer: TracerInterface = {
        spanStartedStream: (() => {
          const readableStream = new Readable({
            objectMode: true,
            read(size: number) {
              return true;
            }
          });
          readableStream.on('data', chunk => {
            if (i == 0) {
              expect(chunk.keyname).toBe("root.execution");
            } else if (i == 1) {
              expect(chunk.keyname).toBe("SpanKeyname");
            }

            i++;
            resolve();
          });

          return readableStream;
        })(),
      }

      const tracingManager: TracingManager = new TracingManager([tracer], logHandlerMock, true, false, new TracingContext());

      tracingManager.startTracing();
      expect.assertions(2);
      tracingManager.startSpan("SpanKeyname");


    })
  })

  it("should call the tracers when the endSpan method is called", async () => {
    return new Promise<void>(resolve => {

      // @ts-ignore
      const tracer: TracerInterface = {
        spanEndedStream: (() => {
          const readableStream = new Readable({
            objectMode: true,
            read(size: number) {
              return true;
            }
          });
          readableStream.on('data', chunk => {
            expect(chunk.keyname).toBe("SpanKeyname");

            resolve();
          });

          return readableStream;
        })(),
        spanStartedStream: new Readable({
          objectMode: true,
          read(size: number) {
            return true;
          }
        }),
      }

      const tracingManager: TracingManager = new TracingManager([tracer], logHandlerMock, true, false, new TracingContext());

      tracingManager.startTracing();

      tracingManager.startSpan("SpanKeyname");
      tracingManager.endSpanKeyname("SpanKeyname");

      expect.assertions(1);
    })
  })

  it("should call the tracers when the endTrace method is called", async () => {
    return new Promise<void>(resolve => {

      const tracer: TracerInterface = {
        spanStartedStream: new Readable({
          objectMode: true,
          read(size: number) {
            return true;
          }
        }),
        spanEndedStream: new Readable({
          objectMode: true,
          read(size: number) {
            return true;
          }
        }),
        traceEndedStream: (() => {
          const readableStream = new Readable({
            objectMode: true,
            read(size: number) {
              return true;
            }
          });
          readableStream.on('data', chunk => {
            expect(chunk.rootSpan.keyname).toBe(SpanKeynameEnum.RootExecution);
            resolve();
          });

          return readableStream;
        })(),
      }

      const tracingManager: TracingManager = new TracingManager([tracer], logHandlerMock, true, false, new TracingContext());

      tracingManager.startTracing();
      tracingManager.endTrace();

      expect(tracingManager.trace!.endDate).toBeDefined();

      expect.assertions(2);
    })
  })

  it("should not override the endDate on the span when it already exists", async () => {
    const tracingManager: TracingManager = new TracingManager([], logHandlerMock, true, false, new TracingContext());

    tracingManager.startTracing();

    const span = new Span("span");

    span.endDate = 3000;

    tracingManager.addSpan(span);

    tracingManager.endTrace();

    expect(span.endDate).toBe(3000);
  })

  it("should end all the spans when the trace is ended", async () => {
    const tracingManager: TracingManager = new TracingManager([], logHandlerMock, true, false, new TracingContext());

    tracingManager.startTracing();

    const span = new Span("span");
    tracingManager.trace!.rootSpan!.addChild(span);

    const span2 = new Span("span2");
    tracingManager.trace!.rootSpan!.addChild(span2);

    const span3 = new Span("span3");
    tracingManager.trace!.rootSpan!.addChild(span3);

    tracingManager.addSpan(span);
    tracingManager.addSpan(span2);
    tracingManager.addSpan(span3);

    tracingManager.endTrace();

    expect(span.endDate).toBeDefined()
    expect(span2.endDate).toBeDefined()
    expect(span3.endDate).toBeDefined()
  })

  it('should end all the children spans when the parent span is ended', async () => {
    const tracingManager: TracingManager = new TracingManager([], logHandlerMock, true, false, new TracingContext());

    tracingManager.startTracing();

    const span = new Span("keyname");
    const childSpan = new Span("child");
    const grandChildSpan = new Span("grandchild");

    span.addChild(childSpan);
    childSpan.addChild(grandChildSpan);

    tracingManager.addSpan(span);

    // Complete the parent span and ensure that the children are properly ended.
    tracingManager.endSpan(span);

    expect(span.endDate).toBeDefined()
    expect(childSpan.endDate).toBeDefined()
    expect(grandChildSpan.endDate).toBeDefined()

    expect(span.inProgress).toBeFalsy();
    expect(childSpan.inProgress).toBeFalsy();
    expect(grandChildSpan.inProgress).toBeFalsy();
  })

  it("should keep the hierarchy intact when sending it to the tracers and send the spans starting with the children first and send each span to the tracers only once per tracer", (done) => {
    const tracer: TracerMock = new TracerMock();

    const spanStartedSpy = jest.spyOn(tracer, "spanStarted")
    const spanEndedSpy = jest.spyOn(tracer, "spanEnded")
    const traceStartedSpy = jest.spyOn(tracer, "traceStarted")
    const traceEndedSpy = jest.spyOn(tracer, "traceEnded")

    const startedSpansSeen: Span[] = [];
    const endedSpansSeen: Span[] = [];

    spanStartedSpy.mockImplementation(span => {
      startedSpansSeen.push(span);
    })

    spanEndedSpy.mockImplementation(span => {
      endedSpansSeen.push(span);
    })

    traceEndedSpy.mockImplementation(trace => {
      expect(startedSpansSeen.length).toBe(4); // The root span + the three spans below.
      expect(endedSpansSeen.length).toBe(4); // The root span + the three spans below.

      expect(startedSpansSeen[0].keyname).toBe(SpanKeynameEnum.RootExecution)
      expect(startedSpansSeen[1].keyname).toBe("parent")
      expect(startedSpansSeen[2].keyname).toBe("child")
      expect(startedSpansSeen[3].keyname).toBe("grandchild")

      expect(endedSpansSeen[0].keyname).toBe("grandchild")
      expect(endedSpansSeen[1].keyname).toBe("child")
      expect(endedSpansSeen[2].keyname).toBe("parent")
      expect(endedSpansSeen[3].keyname).toBe(SpanKeynameEnum.RootExecution)

      done();
    })

    const tracingManager: TracingManager = new TracingManager([tracer], logHandlerMock, true, false, new TracingContext());
    tracingManager.startTracing();

    const span = new Span("parent");

    const childSpan = new Span("child");
    const grandChildSpan = new Span("grandchild");

    tracingManager.trace!.rootSpan!.addChild(span);
    span.addChild(childSpan);
    childSpan.addChild(grandChildSpan);

    tracingManager.addSpan(span);

    tracingManager.endTrace();

    expect.assertions(10);
  })

  it("should only execute endSpan once per span even if endSpan is called multiple times", (done) => {
    const tracer: TracerMock = new TracerMock();

    const spanStartedSpy = jest.spyOn(tracer, "spanStarted")
    const spanEndedSpy = jest.spyOn(tracer, "spanEnded")
    const traceStartedSpy = jest.spyOn(tracer, "traceStarted")
    const traceEndedSpy = jest.spyOn(tracer, "traceEnded")

    const startedSpansSeen: Span[] = [];
    const endedSpansSeen: Span[] = [];

    spanStartedSpy.mockImplementation(span => {
      startedSpansSeen.push(span);
    })

    spanEndedSpy.mockImplementation(span => {
      endedSpansSeen.push(span);
    })

    traceEndedSpy.mockImplementation(trace => {
      expect(startedSpansSeen.length).toBe(4); // The root span + three spans below.
      expect(endedSpansSeen.length).toBe(4); // The root span + The the three spans below.

      done();
    })

    const tracingManager: TracingManager = new TracingManager([tracer], logHandlerMock, true, false, new TracingContext());
    tracingManager.startTracing();

    const span = new Span("parent");

    const childSpan = new Span("child");
    const grandChildSpan = new Span("grandchild");

    tracingManager.trace!.rootSpan!.addChild(span);
    span.addChild(childSpan);
    childSpan.addChild(grandChildSpan);

    tracingManager.addSpan(span);

    tracingManager.endSpan(span);
    tracingManager.endSpan(span);
    tracingManager.endSpan(span);

    tracingManager.endTrace();

    expect.assertions(2);
  })

  // Regression test for the singleton → container-scoped flip. Before this change,
  // TracingManager was `@singleton()` and a single instance was shared across every
  // event in the process. Two parallel events would each call `startTracing()` on the
  // same instance and clobber each other's `this.trace`. With container-scoped, the
  // contract is: each container gets its own instance, so this clobbering can't happen
  // even if both events resolve from `kernel.container` directly.
  it("does not share trace state across separate TracingManager instances", async () => {
    const tmA = new TracingManager([], logHandlerMock, true, false, new TracingContext());
    const tmB = new TracingManager([], logHandlerMock, true, false, new TracingContext());

    tmA.startTracing("event-a");
    tmB.startTracing("event-b");

    expect(tmA.trace).toBeDefined();
    expect(tmB.trace).toBeDefined();
    expect(tmA.trace!.id).not.toBe(tmB.trace!.id);

    // Each manager has its own root span keyname — proves the state isn't shared.
    expect(tmA.trace!.rootSpan!.keyname).toBe("event-a");
    expect(tmB.trace!.rootSpan!.keyname).toBe("event-b");
  })

  describe("addEventToCurrentSpan", () => {
    it("attaches an event to the most-recently-started in-progress span", () => {
      const tm = new TracingManager([], logHandlerMock, true, false, new TracingContext());
      tm.startTracing("root");
      const child = tm.startSpan("child");

      tm.addEventToCurrentSpan("validation passed", {field: "email"});

      expect(child.events).toHaveLength(1);
      expect(child.events[0].message).toBe("validation passed");
      expect(child.events[0].attributes).toEqual({field: "email"});
    });

    it("falls back to the root span if it's the only one open", () => {
      const tm = new TracingManager([], logHandlerMock, true, false, new TracingContext());
      const root = tm.startTracing("root");

      tm.addEventToCurrentSpan("starting up");

      expect(root.events).toHaveLength(1);
      expect(root.events[0].message).toBe("starting up");
    });

    it("does not attach to spans that have already ended", () => {
      const tm = new TracingManager([], logHandlerMock, true, false, new TracingContext());
      const root = tm.startTracing("root");
      const child = tm.startSpan("child");
      child.end();

      tm.addEventToCurrentSpan("after-child-ended");

      // Should attach to root (still in progress), not child (ended).
      expect(child.events).toHaveLength(0);
      expect(root.events).toHaveLength(1);
    });

    it("warns and drops the marker when no trace is active", () => {
      const tm = new TracingManager([], logHandlerMock, true, false, new TracingContext());
      const warningSpy = jest.spyOn(logHandlerMock, "warning");
      expect(() => tm.addEventToCurrentSpan("nope")).not.toThrow();
      expect(warningSpy).toHaveBeenCalledWith(
        expect.stringContaining("addEventToCurrentSpan called outside any active trace"),
        expect.objectContaining({extra: expect.objectContaining({message: "nope"})}),
      );
      warningSpy.mockRestore();
    });
  });

  describe("getCurrentTrail", () => {
    it("returns an empty trail when no trace is active", () => {
      const tm = new TracingManager([], logHandlerMock, true, false, new TracingContext());
      expect(tm.getCurrentTrail()).toEqual([]);
    });

    it("flattens spans + events sorted by timestamp", () => {
      const tm = new TracingManager([], logHandlerMock, true, false, new TracingContext());
      tm.startTracing("root");
      tm.addEventToCurrentSpan("about-to-fork");
      const child1 = tm.startSpan("child-1");
      tm.addEventToCurrentSpan("inside-child-1");
      child1.end();
      tm.startSpan("child-2");

      const trail = tm.getCurrentTrail();
      expect(trail.length).toBe(5);

      const names = trail.map(e => e.name);
      expect(names).toContain("root (active)");
      expect(names).toContain("about-to-fork");
      expect(names).toContain("child-1");                  // ended, no suffix
      expect(names).toContain("inside-child-1");
      expect(names).toContain("child-2 (active)");

      // First entry is the root (started first).
      expect(trail[0].name).toBe("root (active)");
    });

    it("annotates entries with kind discriminator (span vs event)", () => {
      const tm = new TracingManager([], logHandlerMock, true, false, new TracingContext());
      tm.startTracing("root");
      tm.addEventToCurrentSpan("marker");

      const trail = tm.getCurrentTrail();
      const spanEntry = trail.find(e => e.name.startsWith("root"));
      const eventEntry = trail.find(e => e.name === "marker");

      expect(spanEntry?.kind).toBe("span");
      expect(eventEntry?.kind).toBe("event");
    });
  });

  describe("EventContext-shared trace (cross-instance continuity)", () => {
    it("two TracingManager instances inside the same EventContext see the same trace", async () => {
      const {EventContext, EventContextManager} = require("@pristine-ts/common");
      const ecm = new EventContextManager();
      const ctx = new EventContext();
      ctx.eventId = "evt-shared";

      await ecm.run(ctx, async () => {
        const tmA = new TracingManager([], logHandlerMock, true, false, new TracingContext());
        const tmB = new TracingManager([], logHandlerMock, true, false, new TracingContext());

        const rootSpan = tmA.startTracing("root");
        // Different instance, but inside the same EventContext, should see the same trace.
        expect(tmB.getCurrentTrail().length).toBeGreaterThan(0);

        tmB.addEventToCurrentSpan("from-instance-B");

        // The marker should be reachable from tmA's view of the trace.
        expect(rootSpan.events.length).toBe(1);
        expect(rootSpan.events[0].message).toBe("from-instance-B");
      });
    });
  });
});
