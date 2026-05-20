import * as fs from "fs";
import {Readable} from "stream";
import {injectable, singleton} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag, Trace} from "@pristine-ts/common";
import {TracerInterface, traceRenderer} from "@pristine-ts/telemetry";
import {ObservabilityModuleKeyname} from "../observability.module.keyname";
import {ObservabilityConfiguration} from "../observability-configuration";
import {ObservabilityRunManager} from "../store/observability-run-manager";
import {RequestSummary} from "../models/request-summary.model";

/**
 * A `Tracer` transport that persists every completed trace into the active run: the full
 * trace tree as `traces/<traceId>.json`, plus a one-line summary appended to
 * `requests.jsonl` (the fast index the `requests` command reads).
 *
 * HTTP metadata (`http.method`, `http.path`, `http.statusCode`) is read from the trace's
 * `context` — populated by the networking HTTP-to-trace enrichment. Non-HTTP traces simply
 * have those fields undefined in the summary.
 *
 * Dormant until a run is begun. Crash-isolated: a write failure becomes a stderr line.
 */
@moduleScoped(ObservabilityModuleKeyname)
@singleton()
@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
export class ObservabilityTracer implements TracerInterface {
  public traceEndedStream: Readable;

  constructor(
    private readonly configuration: ObservabilityConfiguration,
    private readonly runManager: ObservabilityRunManager,
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
    if (this.configuration.enabled === false) {
      return;
    }

    const traceFile = this.runManager.traceFile(trace.id);
    const requestsFile = this.runManager.requestsFile();
    if (traceFile === undefined || requestsFile === undefined) {
      return;
    }

    const traceContent = traceRenderer.renderJson(trace);
    const requestLine = JSON.stringify(this.buildSummary(trace)) + "\n";
    fs.writeFileSync(traceFile, traceContent);
    fs.appendFileSync(requestsFile, requestLine);
    this.runManager.recordBytesWritten(Buffer.byteLength(traceContent) + Buffer.byteLength(requestLine));
  }

  private buildSummary(trace: Trace): RequestSummary {
    const context = trace.context ?? {};
    const summary = new RequestSummary(
      trace.id,
      trace.startDate,
      trace.getDuration(),
      trace.rootSpan?.keyname ?? "",
    );

    summary.httpMethod = context["http.method"];
    summary.httpPath = context["http.path"];

    const status = context["http.statusCode"];
    if (status !== undefined) {
      const parsed = Number(status);
      summary.httpStatus = Number.isNaN(parsed) ? undefined : parsed;
    }

    return summary;
  }

  private reportFailure(error: unknown): void {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    try {
      process.stderr.write(`[pristine][observability-tracer] ${message}\n`);
    } catch {
      // If stderr is unwritable too, there is nothing useful left to do.
    }
  }
}
