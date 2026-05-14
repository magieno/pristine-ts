import "reflect-metadata";
import {Readable} from "stream";
import {LogHandler} from "./log.handler";
import {LoggerInterface} from "../interfaces/logger.interface";
import {BreadcrumbHandlerInterface} from "../interfaces/breadcrumb-handler.interface";
import {TracingContext} from "@pristine-ts/common";

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
