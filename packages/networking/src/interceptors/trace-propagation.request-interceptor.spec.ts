import "reflect-metadata"
import {LogHandlerMock} from "../../../../tests/mocks/log.handler.mock";
import {HttpMethod, Request, TracingContext} from "@pristine-ts/common";
import {TracingManager} from "@pristine-ts/telemetry";
import {TracePropagationRequestInterceptor} from "./trace-propagation.request-interceptor";

describe("Trace Propagation Request Interceptor", () => {
  const logHandlerMock = new LogHandlerMock();

  const createTracingManager = (): TracingManager => {
    const tracingManager = new TracingManager([], logHandlerMock, true, false, new TracingContext());
    tracingManager.startTracing();
    return tracingManager;
  }

  const createRequest = (traceParent?: string): Request => {
    const request = new Request(HttpMethod.Get, "http://localhost", "uuid");
    if (traceParent !== undefined) {
      request.setHeader("traceparent", traceParent);
    }
    return request;
  }

  it("continues the caller's trace when the traceparent header is valid", async () => {
    const tracingManager = createTracingManager();
    const interceptor = new TracePropagationRequestInterceptor(true, tracingManager, logHandlerMock);

    await interceptor.interceptRequest(createRequest("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"));

    expect(tracingManager.trace!.id).toBe("4bf92f35-77b3-4da6-a3ce-929d0e0e4736");
    expect(tracingManager.trace!.context!["trace.parentSpanId"]).toBe("00f067aa0ba902b7");
  })

  it("reads the header case-insensitively", async () => {
    const tracingManager = createTracingManager();
    const interceptor = new TracePropagationRequestInterceptor(true, tracingManager, logHandlerMock);
    const request = new Request(HttpMethod.Get, "http://localhost", "uuid");
    request.setHeaders({"Traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"});

    await interceptor.interceptRequest(request);

    expect(tracingManager.trace!.id).toBe("4bf92f35-77b3-4da6-a3ce-929d0e0e4736");
  })

  it("keeps the trace id when there is no traceparent header", async () => {
    const tracingManager = createTracingManager();
    const traceId = tracingManager.trace!.id;
    const interceptor = new TracePropagationRequestInterceptor(true, tracingManager, logHandlerMock);

    await interceptor.interceptRequest(createRequest());

    expect(tracingManager.trace!.id).toBe(traceId);
  })

  it("keeps the trace id when the traceparent header is invalid", async () => {
    const tracingManager = createTracingManager();
    const traceId = tracingManager.trace!.id;
    const interceptor = new TracePropagationRequestInterceptor(true, tracingManager, logHandlerMock);

    await interceptor.interceptRequest(createRequest("00-00000000000000000000000000000000-00f067aa0ba902b7-01"));

    expect(tracingManager.trace!.id).toBe(traceId);
    expect(tracingManager.trace!.context!["trace.parentSpanId"]).toBeUndefined();
  })

  it("keeps the trace id when the interceptor is not active", async () => {
    const tracingManager = createTracingManager();
    const traceId = tracingManager.trace!.id;
    const interceptor = new TracePropagationRequestInterceptor(false, tracingManager, logHandlerMock);

    await interceptor.interceptRequest(createRequest("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"));

    expect(tracingManager.trace!.id).toBe(traceId);
  })

  it("returns the request unchanged", async () => {
    const interceptor = new TracePropagationRequestInterceptor(true, createTracingManager(), logHandlerMock);
    const request = createRequest("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");

    expect(await interceptor.interceptRequest(request)).toBe(request);
  })
})
