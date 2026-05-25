import "reflect-metadata";
import {Readable} from "stream";
import {injectable} from "tsyringe";
import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {HttpMethod, Request, Response, ServiceDefinitionTagEnum, tag, Trace} from "@pristine-ts/common";
import {TracerInterface} from "@pristine-ts/telemetry";
import {testModule} from "../../../src/test.module";

/**
 * Captures every `Trace` that `TracingManager` pushes to `traceEndedStream` — the same
 * stream the observability tracer subscribes to. Tagged as a Tracer so it's picked up by
 * `TracingManager.@injectAll(Tracer)` like any other tracer.
 *
 * Writes captured traces into a module-level array so the test can assert on them
 * without having to resolve the tracer instance (which is transient under `@injectable`).
 */
const capturedTraces: Trace[] = [];

@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
class CapturingTracer implements TracerInterface {
  public readonly traceEndedStream: Readable;

  constructor() {
    this.traceEndedStream = new Readable({objectMode: true, read() { return true; }});
    this.traceEndedStream.on("data", (trace: Trace) => capturedTraces.push(trace));
  }
}

describe("Networking - TraceEnrichmentInterceptor", () => {
  beforeEach(() => {
    capturedTraces.length = 0;
  });

  it("stamps http.method, http.path and http.statusCode onto the trace context, with the query string stripped from the path", async () => {
    const kernel = new Kernel();
    await kernel.start(
      {
        ...testModule,
        importServices: [...(testModule.importServices ?? []), CapturingTracer],
      },
      {
        "pristine.logging.consoleLoggerActivated": false,
      },
    );

    // `NestedController` (in tests/e2e/src/controllers/nested.controller.ts) handles
    // GET /api/2.0/magieno/pristine with a 200 + {NestedController: true}.
    const request = new Request(HttpMethod.Get, "/api/2.0/magieno/pristine?foo=bar", "uuid-trace-enrich");

    const response = await kernel.handle(request, {
      keyname: ExecutionContextKeynameEnum.Jest,
      context: {},
    }) as Response;

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);

    // `traceEndedStream` push is asynchronous (Node Readable emits 'data' next tick),
    // so give the stream a turn to deliver before reading what was captured.
    await new Promise(resolve => setTimeout(resolve, 50));

    // The trace the interceptor enriched is the one whose context carries `http.method`.
    const enriched = capturedTraces.find(trace => trace.context?.["http.method"] !== undefined);
    expect(enriched).toBeDefined();
    expect(enriched!.context!["http.method"]).toBe(HttpMethod.Get);
    expect(enriched!.context!["http.path"]).toBe("/api/2.0/magieno/pristine"); // query stripped
    expect(enriched!.context!["http.statusCode"]).toBe("200");
  });
});
