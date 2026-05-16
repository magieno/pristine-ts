import "reflect-metadata";
import {Readable} from "stream";
import {LogHandler} from "./log.handler";
import {LoggerInterface} from "../interfaces/logger.interface";
import {BreadcrumbHandlerInterface} from "../interfaces/breadcrumb-handler.interface";
import {SpanTrailProviderInterface} from "../interfaces/span-trail-provider.interface";
import {BreadcrumbModel} from "../models/breadcrumb.model";
import {EventContext, EventContextManager, TracingContext} from "@pristine-ts/common";

/**
 * Builds a Readable that synchronously throws inside its 'data' listener — the worst
 * shape of "broken logger" because the throw propagates back up through `.push()`.
 */
function buildThrowingStream(error: Error): Readable {
  const stream = new Readable({
    objectMode: true,
    read(_size: number) {
      return true;
    },
  });
  stream.on("data", () => {
    throw error;
  });
  return stream;
}

function buildCapturingStream(received: any[]): Readable {
  const stream = new Readable({
    objectMode: true,
    read(_size: number) {
      return true;
    },
  });
  stream.on("data", (chunk) => {
    received.push(chunk);
  });
  return stream;
}

describe("LogHandler crash isolation", () => {
  let stderrSpy: jest.SpyInstance;
  let breadcrumb: BreadcrumbHandlerInterface;
  let tracing: TracingContext;

  beforeEach(() => {
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    breadcrumb = {
      breadcrumbs: {},
      add: jest.fn(),
    } as unknown as BreadcrumbHandlerInterface;
    tracing = new TracingContext();
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it("does not propagate a throw from a single logger back to the caller", () => {
    const throwingLogger: LoggerInterface = {
      readableStream: buildThrowingStream(new Error("boom")),
      isActive: () => true,
      terminate: () => undefined,
    };

    const handler = new LogHandler(
      [throwingLogger],
      0,
      false,
      "kernel-id",
      breadcrumb,
      tracing,
    );

    expect(() => handler.info("anything")).not.toThrow();
    expect(stderrSpy).toHaveBeenCalled();
  });

  it("delivers the entry to other loggers even when one logger throws", () => {
    const received: any[] = [];
    const throwingLogger: LoggerInterface = {
      readableStream: buildThrowingStream(new Error("boom")),
      isActive: () => true,
      terminate: () => undefined,
    };
    const goodLogger: LoggerInterface = {
      readableStream: buildCapturingStream(received),
      isActive: () => true,
      terminate: () => undefined,
    };

    const handler = new LogHandler(
      [throwingLogger, goodLogger],
      0,
      false,
      "kernel-id",
      breadcrumb,
      tracing,
    );

    handler.info("hello");

    expect(received).toHaveLength(1);
    expect(received[0].message).toBe("hello");
  });

  it("absorbs a throw raised after the throwing logger when another good logger comes after", () => {
    const received: any[] = [];
    const goodFirst: LoggerInterface = {
      readableStream: buildCapturingStream(received),
      isActive: () => true,
      terminate: () => undefined,
    };
    const throwingLast: LoggerInterface = {
      readableStream: buildThrowingStream(new Error("late boom")),
      isActive: () => true,
      terminate: () => undefined,
    };

    const handler = new LogHandler(
      [goodFirst, throwingLast],
      0,
      false,
      "kernel-id",
      breadcrumb,
      tracing,
    );

    expect(() => handler.error("hello")).not.toThrow();
    expect(received).toHaveLength(1);
  });
});

describe("LogHandler eventId + traceId resolution", () => {
  let breadcrumb: BreadcrumbHandlerInterface;
  let tracing: TracingContext;

  beforeEach(() => {
    breadcrumb = {
      breadcrumbs: {},
      add: jest.fn(),
    } as unknown as BreadcrumbHandlerInterface;
    tracing = new TracingContext();
  });

  function captureFirstLog(handler: LogHandler, received: any[]): void {
    handler.info("captured");
    // entry is captured by the buildCapturingStream-backed logger.
  }

  function buildHandlerWithCapture(): {handler: LogHandler; received: any[]} {
    const received: any[] = [];
    const logger: LoggerInterface = {
      readableStream: buildCapturingStream(received),
      isActive: () => true,
      terminate: () => undefined,
    };
    const handler = new LogHandler(
      [logger],
      0,
      false,
      "kernel-id",
      breadcrumb,
      tracing,
    );
    return {handler, received};
  }

  it("auto-fills eventId from the active EventContext when caller didn't pass one", () => {
    const {handler, received} = buildHandlerWithCapture();
    const manager = new EventContextManager();
    const ctx = new EventContext();
    ctx.eventId = "evt-from-als";

    manager.run(ctx, () => handler.info("hello", {extra: {foo: "bar"}}));

    expect(received).toHaveLength(1);
    expect(received[0].eventId).toBe("evt-from-als");
  });

  it("explicit eventId in the call wins over the EventContext value", () => {
    const {handler, received} = buildHandlerWithCapture();
    const manager = new EventContextManager();
    const ctx = new EventContext();
    ctx.eventId = "evt-from-als";

    manager.run(ctx, () => handler.info("hello", {eventId: "evt-explicit"}));

    expect(received).toHaveLength(1);
    expect(received[0].eventId).toBe("evt-explicit");
  });

  it("omits eventId when there's no EventContext and no explicit value", () => {
    const {handler, received} = buildHandlerWithCapture();
    handler.info("hello");
    expect(received).toHaveLength(1);
    expect(received[0].eventId).toBeUndefined();
  });

  it("auto-fills traceId from the active EventContext", () => {
    const {handler, received} = buildHandlerWithCapture();
    const manager = new EventContextManager();
    const ctx = new EventContext();
    ctx.eventId = "evt-x";
    ctx.traceId = "trace-from-als";

    manager.run(ctx, () => handler.info("hello"));

    expect(received[0].traceId).toBe("trace-from-als");
  });

  it("falls back to TracingContext.traceId when EventContext has none (back-compat path)", () => {
    const {handler, received} = buildHandlerWithCapture();
    tracing.traceId = "trace-from-legacy-context";
    handler.info("hello");
    expect(received[0].traceId).toBe("trace-from-legacy-context");
  });

  it("EventContext traceId wins over TracingContext when both are set", () => {
    const {handler, received} = buildHandlerWithCapture();
    tracing.traceId = "trace-legacy";
    const manager = new EventContextManager();
    const ctx = new EventContext();
    ctx.eventId = "evt-x";
    ctx.traceId = "trace-modern";

    manager.run(ctx, () => handler.info("hello"));

    expect(received[0].traceId).toBe("trace-modern");
  });
});

describe("LogHandler breadcrumb trail merging", () => {
  let stderrSpy: jest.SpyInstance;
  let breadcrumb: BreadcrumbHandlerInterface;
  let tracing: TracingContext;

  beforeEach(() => {
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    breadcrumb = {
      breadcrumbs: {},
      add: jest.fn(),
      reset: jest.fn(),
    } as unknown as BreadcrumbHandlerInterface;
    tracing = new TracingContext();
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  function buildHandlerWithCapture(): {handler: LogHandler; received: any[]} {
    const received: any[] = [];
    const logger: LoggerInterface = {
      readableStream: buildCapturingStream(received),
      isActive: () => true,
      terminate: () => undefined,
    };
    const handler = new LogHandler([logger], 0, false, "kernel-id", breadcrumb, tracing);
    return {handler, received};
  }

  // Builds a fake DependencyContainer-shaped object whose resolve() returns the given
  // provider for the "SpanTrailProviderInterface" token. Stubs the per-event container
  // that LogHandler reads from at log time (see the in-source comment on
  // `buildBreadcrumbTrail` for the justification of that dynamic lookup).
  function fakeContainerWithProvider(provider: SpanTrailProviderInterface | undefined): any {
    return {
      resolve: (token: string) => {
        if (token === "SpanTrailProviderInterface") {
          if (provider === undefined) throw new Error("no provider registered");
          return provider;
        }
        throw new Error("unexpected token: " + token);
      },
    };
  }

  it("uses manual breadcrumbs alone when no SpanTrailProvider is registered", () => {
    const {handler, received} = buildHandlerWithCapture();
    const manual = new BreadcrumbModel("manual-only");
    manual.date = new Date(1000);

    const manager = new EventContextManager();
    const ctx = new EventContext();
    ctx.eventId = "evt-manual";
    ctx.container = fakeContainerWithProvider(undefined);
    breadcrumb.breadcrumbs["evt-manual"] = [manual];

    manager.run(ctx, () => handler.info("hello"));

    expect(received[0].breadcrumbs).toHaveLength(1);
    expect(received[0].breadcrumbs[0].message).toBe("manual-only");
  });

  it("merges manual and span-derived entries by timestamp", () => {
    const spanCrumb = new BreadcrumbModel("span-derived", {kind: "span"});
    spanCrumb.date = new Date(2000);
    const provider: SpanTrailProviderInterface = {getCurrentTrail: () => [spanCrumb]};

    const {handler, received} = buildHandlerWithCapture();

    const manual = new BreadcrumbModel("manual-1");
    manual.date = new Date(1000);
    breadcrumb.breadcrumbs["evt-merged"] = [manual];

    const manager = new EventContextManager();
    const ctx = new EventContext();
    ctx.eventId = "evt-merged";
    ctx.container = fakeContainerWithProvider(provider);

    manager.run(ctx, () => handler.info("hello"));

    expect(received[0].breadcrumbs).toHaveLength(2);
    // Sorted by date: manual (1000ms) before span-derived (2000ms).
    expect(received[0].breadcrumbs[0].message).toBe("manual-1");
    expect(received[0].breadcrumbs[1].message).toBe("span-derived");
  });

  it("returns an empty trail when neither source has entries", () => {
    const {handler, received} = buildHandlerWithCapture();
    const manager = new EventContextManager();
    const ctx = new EventContext();
    ctx.eventId = "evt-empty";

    manager.run(ctx, () => handler.info("hello"));

    expect(received[0].breadcrumbs).toEqual([]);
  });

  it("silently falls back to manual entries when the provider lookup throws", () => {
    const {handler, received} = buildHandlerWithCapture();
    const manual = new BreadcrumbModel("manual-fallback");
    manual.date = new Date(1000);
    breadcrumb.breadcrumbs["evt-no-provider"] = [manual];

    const manager = new EventContextManager();
    const ctx = new EventContext();
    ctx.eventId = "evt-no-provider";
    ctx.container = fakeContainerWithProvider(undefined);

    manager.run(ctx, () => handler.info("hello"));

    expect(received[0].breadcrumbs).toHaveLength(1);
    expect(received[0].breadcrumbs[0].message).toBe("manual-fallback");
  });
});

