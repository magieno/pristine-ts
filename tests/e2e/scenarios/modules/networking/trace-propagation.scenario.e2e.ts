import "reflect-metadata";
import {Readable} from "stream";
import {container, inject, injectable} from "tsyringe";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {controller, NetworkingModule, route} from "@pristine-ts/networking";
import {AppModuleInterface, HttpMethod, Request, Response, ServiceDefinitionTagEnum, tag, Trace} from "@pristine-ts/common";
import {LoggerInterface, LogHandlerInterface, LogModel} from "@pristine-ts/logging";
import {TracerInterface} from "@pristine-ts/telemetry";

/**
 * Module-level arrays so the test reads what was captured without resolving the
 * (transient) logger and tracer instances.
 */
const capturedLogs: LogModel[] = [];
const capturedTraces: Trace[] = [];

@tag(ServiceDefinitionTagEnum.Logger)
@injectable()
class CapturingLogger implements LoggerInterface {
  public readonly readableStream: Readable;

  constructor() {
    this.readableStream = new Readable({objectMode: true, read() { return true; }});
    this.readableStream.on("data", (log: LogModel) => capturedLogs.push(log));
  }

  isActive(): boolean {
    return true;
  }

  terminate(): void {
  }
}

@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
class CapturingTracer implements TracerInterface {
  public readonly traceEndedStream: Readable;

  constructor() {
    this.traceEndedStream = new Readable({objectMode: true, read() { return true; }});
    this.traceEndedStream.on("data", (trace: Trace) => capturedTraces.push(trace));
  }
}

@controller("/api/trace-propagation")
@injectable()
class TracePropagationTestController {
  constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
  }

  @route(HttpMethod.Get, "/")
  get() {
    this.logHandler.error("trace-propagation-log");
    return {};
  }
}

describe("Networking - TracePropagationRequestInterceptor", () => {
  const startKernel = async (configuration: { [key: string]: any } = {}): Promise<Kernel> => {
    const kernel = new Kernel();
    await kernel.start({
      keyname: "trace.propagation.test",
      importServices: [TracePropagationTestController, CapturingLogger, CapturingTracer],
      importModules: [CoreModule, NetworkingModule],
      providerRegistrations: [],
    } as AppModuleInterface, {
      "pristine.logging.consoleLoggerActivated": false,
      ...configuration,
    });
    return kernel;
  }

  const handle = async (kernel: Kernel, traceParent?: string): Promise<Response> => {
    const request = new Request(HttpMethod.Get, "http://localhost/api/trace-propagation", "uuid-trace-propagation");
    if (traceParent !== undefined) {
      request.setHeader("traceparent", traceParent);
    }

    const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

    // `traceEndedStream` emits 'data' on a later tick.
    await new Promise(resolve => setTimeout(resolve, 50));

    return response;
  }

  const controllerLog = () => capturedLogs.find(log => log.message === "trace-propagation-log");

  beforeEach(() => {
    container.clearInstances();
    capturedLogs.length = 0;
    capturedTraces.length = 0;
  });

  it("gives the logs and the trace the caller's trace id", async () => {
    const kernel = await startKernel();

    const response = await handle(kernel, "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");

    expect(response.status).toBe(200);
    expect(controllerLog()?.traceId).toBe("4bf92f35-77b3-4da6-a3ce-929d0e0e4736");

    const trace = capturedTraces.find(trace => trace.id === "4bf92f35-77b3-4da6-a3ce-929d0e0e4736");
    expect(trace).toBeDefined();
    expect(trace!.context!["trace.parentSpanId"]).toBe("00f067aa0ba902b7");
  });

  it("keeps a new trace id when there is no traceparent header", async () => {
    const kernel = await startKernel();

    await handle(kernel);

    const traceId = controllerLog()?.traceId;
    expect(traceId).toBeDefined();
    expect(traceId).not.toBe("4bf92f35-77b3-4da6-a3ce-929d0e0e4736");
    expect(capturedTraces.some(trace => trace.id === traceId)).toBe(true);
  });

  it("ignores the traceparent header when trace propagation is not active", async () => {
    const kernel = await startKernel({"pristine.networking.tracePropagation.isActive": false});

    await handle(kernel, "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");

    expect(controllerLog()?.traceId).toBeDefined();
    expect(controllerLog()?.traceId).not.toBe("4bf92f35-77b3-4da6-a3ce-929d0e0e4736");
  });
});
