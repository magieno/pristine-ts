import {inject, injectable} from "tsyringe";
import {Readable} from "stream";
import {TelemetryConfigurationKeys, TracerInterface, Trace as PristineTrace, Span as PristineSpan} from "@pristine-ts/telemetry";
import {injectConfig, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {TraceExporter} from "@google-cloud/opentelemetry-cloud-trace-exporter";
import {BasicTracerProvider, BatchSpanProcessor} from "@opentelemetry/sdk-trace-base";
import {Resource} from "@opentelemetry/resources";
import {SemanticResourceAttributes} from "@opentelemetry/semantic-conventions";
import {SpanKind} from "@opentelemetry/api";
import {GcpTraceModuleKeyname} from "../gcp-trace.module.keyname";
import {GcpTraceConfigurationKeys} from "../gcp-trace.configuration-keys";

/**
 * Tracer that exports Pristine traces to Google Cloud Trace.
 *
 * Always constructed when `@pristine-ts/gcp-trace` is in the import graph (framework
 * requirement — the tracer wires up the trace-ended stream listener at construction
 * time). Set `pristine.gcp-trace.activated=true` to opt in to exporting; when off,
 * the listener early-returns and the exporter is never touched.
 *
 * Mirror of `XrayTracer` in `@pristine-ts/aws-xray`.
 */
@moduleScoped(GcpTraceModuleKeyname)
@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
export class CloudTraceTracer implements TracerInterface {
  traceEndedStream: Readable;
  private provider?: BasicTracerProvider;

  constructor(
    @injectConfig(TelemetryConfigurationKeys.Debug) private readonly telemetryDebug: boolean,
    @injectConfig(GcpTraceConfigurationKeys.Debug) private readonly debug: boolean,
    @injectConfig(GcpTraceConfigurationKeys.Activated) private readonly activated: boolean,
    @injectConfig(GcpTraceConfigurationKeys.ProjectId) private readonly projectId: string,
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
    this.traceEndedStream = new Readable({
      objectMode: true,
      read(size: number) {
        return true;
      },
    });

    this.traceEndedStream.on("data", (trace: PristineTrace) => {
      // Honor the activation flag inside the listener (not at construction time) so
      // the setting can be re-read without rebuilding the kernel. When off, drop the
      // trace.
      if (this.activated === false) {
        return;
      }
      try {
        this.exportTrace(trace);
      } catch (e) {
        this.logHandler.error("CloudTraceTracer: Failed to export trace.", {extra: {error: e}});
      }
    });
  }

  private getProvider(): BasicTracerProvider {
    if (this.provider) {
      return this.provider;
    }
    const exporter = new TraceExporter({projectId: this.projectId});
    this.provider = new BasicTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: "pristine-ts",
      }),
    });
    this.provider.addSpanProcessor(new BatchSpanProcessor(exporter));
    this.provider.register();
    return this.provider;
  }

  private exportTrace(trace: PristineTrace): void {
    if (trace.rootSpan === undefined) {
      this.logHandler.error("CloudTraceTracer: The root span of the trace is undefined.", {extra: {trace}});
      return;
    }
    const otelTracer = this.getProvider().getTracer("pristine-ts");
    this.captureSpan(otelTracer, trace.rootSpan);
    if (this.debug) {
      this.logHandler.debug("CloudTraceTracer: Trace exported.", {extra: {trace}});
    }
  }

  /**
   * Recursively translates Pristine spans into OpenTelemetry spans. OTel's API is
   * push-based: we start a span, set attributes, and end it; the SDK batches and
   * ships to Cloud Trace via the exporter we registered.
   */
  private captureSpan(otelTracer: ReturnType<BasicTracerProvider["getTracer"]>, span: PristineSpan): void {
    const otSpan = otelTracer.startSpan(span.keyname, {
      kind: SpanKind.INTERNAL,
      startTime: span.startDate,
    });
    otSpan.setAttribute("pristine.span_id", span.id);
    if (span.trace !== undefined) {
      otSpan.setAttribute("pristine.trace_id", span.trace.id);
    }
    if (span.context) {
      for (const key of Object.keys(span.context)) {
        const value = span.context[key];
        if (value !== undefined && value !== null) {
          otSpan.setAttribute(key, typeof value === "object" ? JSON.stringify(value) : value);
        }
      }
    }
    span.children?.forEach((child) => this.captureSpan(otelTracer, child));
    otSpan.end(span.endDate ?? Date.now());
  }
}
