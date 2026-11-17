import "reflect-metadata";
import {Readable} from "stream";
import {LogHandler} from "./log.handler";
import {LoggerInterface} from "../interfaces/logger.interface";
import {SeverityEnum} from "../enums/severity.enum";
import {EventContext, EventContextManager, TracingContext} from "@pristine-ts/common";
import {LogSanitizer} from "../sanitizers/log.sanitizer";

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
  let tracing: TracingContext;

  beforeEach(() => {
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    tracing = new TracingContext();
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it("does not propagate a throw from a single logger back to the caller", () => {
    const throwingLogger: LoggerInterface = {
      readableStream: buildThrowingStream(new Error("boom")),
      isActive: () => true,
      terminate: (): void => { return; },
    };

    const handler = new LogHandler(
      [throwingLogger],
      0,
      false,
      "kernel-id",
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
      terminate: (): void => { return; },
    };
    const goodLogger: LoggerInterface = {
      readableStream: buildCapturingStream(received),
      isActive: () => true,
      terminate: (): void => { return; },
    };

    const handler = new LogHandler(
      [throwingLogger, goodLogger],
      0,
      false,
      "kernel-id",
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
      terminate: (): void => { return; },
    };
    const throwingLast: LoggerInterface = {
      readableStream: buildThrowingStream(new Error("late boom")),
      isActive: () => true,
      terminate: (): void => { return; },
    };

    const handler = new LogHandler(
      [goodFirst, throwingLast],
      0,
      false,
      "kernel-id",
      tracing,
    );

    expect(() => handler.error("hello")).not.toThrow();
    expect(received).toHaveLength(1);
  });
});

describe("LogHandler eventId + traceId resolution", () => {
  let tracing: TracingContext;

  beforeEach(() => {
    tracing = new TracingContext();
  });

  function buildHandlerWithCapture(): {handler: LogHandler; received: any[]} {
    const received: any[] = [];
    const logger: LoggerInterface = {
      readableStream: buildCapturingStream(received),
      isActive: () => true,
      terminate: (): void => { return; },
    };
    const handler = new LogHandler(
      [logger],
      0,
      false,
      "kernel-id",
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

  it("success() emits a LogModel at SeverityEnum.Success", () => {
    const {handler, received} = buildHandlerWithCapture();
    handler.success("done");
    expect(received).toHaveLength(1);
    expect(received[0].severity).toBe(SeverityEnum.Success);
    expect(received[0].message).toBe("done");
  });
});

describe("LogHandler and the sanitizer", () => {
  const activeLogger = (received: any[], active = true): LoggerInterface => ({
    readableStream: buildCapturingStream(received),
    isActive: () => active,
    terminate: (): void => { return; },
  } as any);

  it("should give every logger the same log, with its secrets removed", () => {
    const first: any[] = [];
    const second: any[] = [];
    const handler = new LogHandler([activeLogger(first), activeLogger(second)], SeverityEnum.Debug, false, "kernel-id", new TracingContext(), new LogSanitizer());
    const headers = {authorization: "Bearer abcdefgh1234", host: "example.com"};

    handler.notice("[INBOUND REQUEST] GET /x with Bearer abcdefgh1234", {highlights: {headers}, extra: {password: "hunter2"}});

    for (const received of [first, second]) {
      expect(received).toHaveLength(1);
      expect(received[0].message).toBe("[INBOUND REQUEST] GET /x with [REDACTED]");
      expect(received[0].highlights).toEqual({headers: {authorization: "[REDACTED]", host: "example.com"}});
      expect(received[0].extra).toEqual({password: "[REDACTED]"});
    }
    expect(headers.authorization).toBe("Bearer abcdefgh1234");
  });

  it("should sanitize the data that is passed whole as the extra", () => {
    const received: any[] = [];
    const handler = new LogHandler([activeLogger(received)], SeverityEnum.Debug, false, "kernel-id", new TracingContext(), new LogSanitizer());

    handler.error("Login failed", {user: "jane", password: "hunter2"});

    expect(received[0].extra).toEqual({user: "jane", password: "[REDACTED]"});
  });

  it("should drop the data of a log when the sanitizer fails, and never let the raw log through", () => {
    const received: any[] = [];
    const failing = {protect: () => { throw new Error("broken"); }} as unknown as LogSanitizer;
    const handler = new LogHandler([activeLogger(received)], SeverityEnum.Debug, false, "kernel-id", new TracingContext(), failing);

    handler.info("Something happened", {highlights: {authorization: "Bearer abcdefgh1234"}, extra: {password: "hunter2"}});

    expect(received).toHaveLength(1);
    expect(received[0].message).toBe("Something happened");
    expect(JSON.stringify(received[0])).not.toContain("abcdefgh1234");
    expect(JSON.stringify(received[0])).not.toContain("hunter2");
  });

  it("should not pay for the sanitizer when no logger is active", () => {
    const protect = jest.fn();
    const handler = new LogHandler([activeLogger([], false)], SeverityEnum.Debug, false, "kernel-id", new TracingContext(), {protect} as unknown as LogSanitizer);

    handler.info("Nobody listens", {highlights: {a: 1}});

    expect(protect).not.toHaveBeenCalled();
  });

  it("should not copy the data of a log that every logger drops without reading it", () => {
    // A logger that only looks at the severity, as BaseLogger does for a log under its threshold.
    const severities: SeverityEnum[] = [];
    const stream = new Readable({objectMode: true, read: () => true});
    stream.on("data", (chunk: any) => severities.push(chunk.severity));
    const logger = {readableStream: stream, isActive: () => true, terminate: (): void => { return; }} as any;
    const handler = new LogHandler([logger], SeverityEnum.Debug, false, "kernel-id", new TracingContext(), new LogSanitizer());
    let reads = 0;
    const container = {
      get everything(): string {
        reads++;
        return "a whole dependency container";
      },
    };

    handler.debug("A debug line of the framework", {extra: {container}});

    expect(severities).toEqual([SeverityEnum.Debug]);
    expect(reads).toBe(0);
  });

  it("should keep working with no sanitizer, as a LogHandler built by hand has none", () => {
    const received: any[] = [];
    const handler = new LogHandler([activeLogger(received)], SeverityEnum.Debug, false, "kernel-id", new TracingContext());

    handler.info("Plain", {highlights: {authorization: "raw"}});

    expect(received[0].highlights).toEqual({authorization: "raw"});
  });
});
