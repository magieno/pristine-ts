import {Readable} from "stream";
import {injectable, singleton} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag, Trace} from "@pristine-ts/common";
import {TracerInterface} from "@pristine-ts/telemetry";
import {ObservabilityModuleKeyname} from "../observability.module.keyname";
import {TraceStore} from "../store/trace-store";

/**
 * A `Tracer` transport that forwards every completed trace to `TraceStore`. Thin adapter
 * — all file I/O, request-summary computation, retention, and per-process partitioning
 * live in `TraceStore`.
 *
 * Crash-isolated: a write failure becomes a stderr line rather than propagating.
 */
@moduleScoped(ObservabilityModuleKeyname)
@singleton()
@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
export class ObservabilityTracer implements TracerInterface {
  public traceEndedStream: Readable;

  constructor(private readonly traceStore: TraceStore) {
    this.traceEndedStream = new Readable({
      objectMode: true,
      read(_size: number) { return true; },
    });

    this.traceEndedStream.on("data", (trace: Trace) => {
      try {
        this.traceStore.append(trace);
      } catch (error) {
        this.reportFailure(error);
      }
    });

    this.traceEndedStream.on("error", (error) => {
      this.reportFailure(error);
    });
  }

  private reportFailure(error: unknown): void {
    try {
      // Stringification happens inside the guard — `error.name`/`error.message`/`String(error)`
      // can all throw on pathological inputs (throwing getters, exotic `Symbol.toPrimitive`,
      // etc.). The safety net must not become the new failure source.
      const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      process.stderr.write(`[pristine][observability-tracer] ${message}\n`);
    } catch {
      // If even stringifying or writing fails, there is nothing useful left to do.
    }
  }
}
