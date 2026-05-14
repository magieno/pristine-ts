import * as fs from "fs";
import * as path from "path";
import {Readable} from "stream";
import {inject, injectable, singleton} from "tsyringe";
import {injectConfig, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {TracerInterface} from "../interfaces/tracer.interface";
import {Trace} from "../models/trace.model";
import {ConsoleTracerOutputModeEnum} from "../enums/console-tracer-output-mode.enum";
import {TelemetryConfigurationKeys} from "../telemetry.configuration-keys";
import {TelemetryModuleKeyname} from "../telemetry.module.keyname";
import {traceRenderer} from "../utils/trace-renderer";

/**
 * `FileTracer` writes one file per completed trace to a configured directory. Files are
 * named after the trace's id (= eventId throughout Pristine), so locating a request's
 * trace is `cat traces/<eventId>.json`.
 *
 * Off by default. Enable via `pristine.telemetry.file-tracer.activated = true`.
 *
 * Configuration:
 *   - `file-tracer.directory`         — defaults to `./traces`
 *   - `file-tracer.filename-pattern`  — defaults to `<traceId>.json`. Placeholders:
 *                                       `<traceId>`, `<date>` (UTC YYYY-MM-DD), `<timestamp>` (ms epoch).
 *   - `file-tracer.output-mode`       — `json` (default), `tree`, or `flat`.
 *
 * Crash-isolated: a write failure (read-only fs, missing permissions, etc.) becomes a
 * stderr line, never an unhandled error. The framework continues and the next trace is
 * attempted independently.
 */
@moduleScoped(TelemetryModuleKeyname)
@singleton()
@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
export class FileTracer implements TracerInterface {
  public traceEndedStream: Readable;

  public constructor(
    @injectConfig(TelemetryConfigurationKeys.FileTracerActivated) private readonly activated: boolean,
    @injectConfig(TelemetryConfigurationKeys.FileTracerOutputMode) private readonly outputMode: ConsoleTracerOutputModeEnum,
    @injectConfig(TelemetryConfigurationKeys.FileTracerDirectory) private readonly directory: string,
    @injectConfig(TelemetryConfigurationKeys.FileTracerFilenamePattern) private readonly filenamePattern: string,
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

    const content = this.renderTrace(trace);
    const filename = this.expandFilenamePattern(trace);
    const absoluteDir = path.resolve(process.cwd(), this.directory);
    const absoluteFile = path.join(absoluteDir, filename);

    // Make sure the file's parent directory exists. We mkdir on the file's parent rather
    // than just `absoluteDir` because filename-pattern can introduce subdirectories
    // (e.g. `<date>/<traceId>.json` partitions traces into per-day folders). `recursive:
    // true` is a no-op if the path already exists.
    fs.mkdirSync(path.dirname(absoluteFile), {recursive: true});

    // Write the file. We use `writeFileSync` rather than the async equivalent because the
    // tracer pipeline is synchronous (the framework `.push()`es into the stream and moves
    // on), and a write that returns a Promise would silently leak rejections. The write
    // is small (one trace's worth of JSON, typically <50KB), so the sync cost is bounded.
    fs.writeFileSync(absoluteFile, content);
  }

  private renderTrace(trace: Trace): string {
    switch (this.outputMode) {
      case ConsoleTracerOutputModeEnum.Tree:
        return traceRenderer.renderTree(trace);
      case ConsoleTracerOutputModeEnum.Flat:
        return traceRenderer.renderFlat(trace);
      case ConsoleTracerOutputModeEnum.Json:
      default:
        return traceRenderer.renderJson(trace);
    }
  }

  private expandFilenamePattern(trace: Trace): string {
    const date = new Date(trace.endDate ?? Date.now());
    const isoDate = date.toISOString().slice(0, 10);   // YYYY-MM-DD
    const timestamp = String(trace.endDate ?? Date.now());

    return this.filenamePattern
      .replace(/<traceId>/g, trace.id)
      .replace(/<date>/g, isoDate)
      .replace(/<timestamp>/g, timestamp);
  }

  private reportFailure(error: unknown): void {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    try {
      process.stderr.write(`[pristine][tracer:FileTracer] ${message}\n`);
    } catch {
      // If stderr is unwritable too, there's nothing useful left to do.
    }
  }
}
