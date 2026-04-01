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
    expect(tracingManager.spans[SpanKeynameEnum.RootExecution]).toBeDefined();
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
});
