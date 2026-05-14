import {inject, injectable, singleton} from "tsyringe";
import {Readable} from "stream";
import {injectConfig, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {TracerInterface} from "../interfaces/tracer.interface";
import {Trace} from "../models/trace.model";
import {ConsoleTracerOutputModeEnum} from "../enums/console-tracer-output-mode.enum";
import {TelemetryConfigurationKeys} from "../telemetry.configuration-keys";
import {TelemetryModuleKeyname} from "../telemetry.module.keyname";
import {traceRenderer} from "../utils/trace-renderer";

/**
 * `ConsoleTracer` prints a completed trace to stdout when the trace ends. Its main purpose
 * is **developer-readable feedback during local development**: see what spans ran, in what
 * order, and which one was the bottleneck — without wiring up an external tracing backend.
 *
 * Off by default. Enable via `pristine.telemetry.console-tracer.activated = true` (or
 * `PRISTINE_TELEMETRY_CONSOLE_TRACER_ACTIVATED=true`). Three output modes:
 *   - `tree` (default): indented ASCII tree, durations right-aligned, slowest leaf flagged.
 *   - `json`: pretty-printed JSON dump.
 *   - `flat`: one line per span, no indentation, start-time-sorted.
 *
 * Crash-isolated: a throw inside the formatting code becomes a stderr line, never an
 * unhandled error or process crash.
 */
@moduleScoped(TelemetryModuleKeyname)
@singleton()
@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
export class ConsoleTracer implements TracerInterface {
  public traceEndedStream: Readable;

  public constructor(
    @injectConfig(TelemetryConfigurationKeys.ConsoleTracerActivated) private readonly activated: boolean,
    @injectConfig(TelemetryConfigurationKeys.ConsoleTracerOutputMode) private readonly outputMode: ConsoleTracerOutputModeEnum,
    @injectConfig(TelemetryConfigurationKeys.ConsoleTracerMinimumDurationMs) private readonly minimumDurationMs: number,
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
    this.traceEndedStream = new Readable({
      objectMode: true,
      read(_size: number) { return true; },
    });

    this.traceEndedStream.on("data", (trace: Trace) => {
      try {
        this.handleTraceEnded(trace);
      } catch (error) {
        this.reportFailure(error);
      }
    });

    this.traceEndedStream.on("error", (error) => {
      this.reportFailure(error);
    });
  }

  private handleTraceEnded(trace: Trace): void {
    if (this.activated === false) {
      return;
    }
    if (trace.getDuration() < this.minimumDurationMs) {
      return;
    }

    let output: string;
    switch (this.outputMode) {
      case ConsoleTracerOutputModeEnum.Json:
        output = traceRenderer.renderJson(trace);
        break;
      case ConsoleTracerOutputModeEnum.Flat:
        output = traceRenderer.renderFlat(trace);
        break;
      case ConsoleTracerOutputModeEnum.Tree:
      default:
        output = traceRenderer.renderTree(trace);
        break;
    }

    // Write directly to stdout. Going through the LogHandler would (a) tag every trace
    // line with severity headers the reader doesn't want, and (b) require the user's log
    // level to be Debug to see anything — defeating the point of opting in.
    process.stdout.write(output + "\n");
  }

  private reportFailure(error: unknown): void {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    try {
      process.stderr.write(`[pristine][tracer:ConsoleTracer] ${message}\n`);
    } catch {
      // If stderr is unwritable too, there's nothing useful left to do.
    }
  }
}
