import {inject, injectable} from "tsyringe";
import {Span, Trace, TelemetryConfigurationKeys, TracerInterface} from "@pristine-ts/telemetry";
import {injectConfig, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Readable} from "stream";
import AWSXRay, {Segment, SegmentUtils, Subsegment} from "aws-xray-sdk";
import {AwsXrayConfigurationKeys} from "../aws-xray.configuration-keys";
import {AwsXrayModuleKeyname} from "../aws-xray.module.keyname";
import {LogHandlerInterface} from "@pristine-ts/logging";

/**
 * Tracer to be able to dump Pristine traces to AWS X-Ray.
 *
 * The tracer is **always constructed** when `@pristine-ts/aws-xray` is in the import
 * graph — that's a structural requirement of the framework's tracer registration. To
 * disable export without removing the package, set the `pristine.aws-xray.activated`
 * configuration to `false` (or `PRISTINE_AWS_XRAY_ACTIVATED=false`). When deactivated,
 * the stream listener early-returns and the AWS X-Ray SDK is never touched.
 */
@moduleScoped(AwsXrayModuleKeyname)
@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
export class XrayTracer implements TracerInterface {
  traceEndedStream: Readable;

  public constructor(@injectConfig(TelemetryConfigurationKeys.Debug) private readonly debug: boolean,
                     @injectConfig(AwsXrayConfigurationKeys.Activated) private readonly activated: boolean,
                     @inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface) {
    this.traceEndedStream = new Readable({
      objectMode: true,
      read(size: number) {
        return true;
      }
    });

    this.traceEndedStream.on('data', (trace: Trace) => {
      // Honor the activation flag inside the listener (not at construction time) so the
      // setting can be re-read without rebuilding the kernel. When off, drop the trace
      // on the floor — the framework still considers the trace "delivered" to this
      // tracer; this tracer just chose not to do anything with it.
      if (this.activated === false) {
        return;
      }
      this.traceEnded(trace);
    });
  }

  /**
   * This method is called when the trace ends.
   * @param trace
   */
  private traceEnded(trace: Trace) {
    let segment = AWSXRay.getSegment() as Segment;

    if (segment === undefined) {
      segment = new AWSXRay.Segment(trace.id);
    }

    if (trace.rootSpan === undefined) {
      this.loghandler.error("The RootSpance of the trace is undefined, there's nothing we can do", {
        segment,
        trace,
      })

      return;
    }

    const subsegment = this.captureSpan(trace.rootSpan, segment);

    segment.flush()

    if (this.debug) {
      this.loghandler.debug("X-Ray trace ended", {
        segment,
        subsegment,
        trace,
      })
    }
  }

  /**
   * This method captures the spans recursively and creates the root segment.
   * @param span
   * @param segment
   * @private
   */
  private captureSpan(span: Span, segment: Segment | Subsegment): Subsegment {
    const subsegment: Subsegment = new Subsegment(span.keyname);
    subsegment.start_time = span.startDate / 1000;

    subsegment.addMetadata("span_id", span.id);

    if (span.trace !== undefined) {
      subsegment.addMetadata("trace_id", span.trace.id);
    }

    if (span.context) {
      Object.keys(span.context).forEach(key => {
        const value = span.context[key];
        if (value) {
          subsegment.addMetadata(key, value);
        }
      })
    }

    span.children?.forEach(childSpan => {
      this.captureSpan(childSpan, segment);
    });

    segment.addSubsegment(subsegment);

    // @ts-ignore Force to rewrite the end time after closing it
    subsegment["end_time"] = span.endDate ? (span.endDate / 1000) : (Date.now() / 1000);

    // It seems that if you call the close method on the subsegment, it will send it before we get a chance to override the end_time
    // Looking at the code on Github, it seems they have fixed and improved this but they haven't published a new version yet. :(
    // subsegment.close()
    // Therefore, we have to close it manually
    delete subsegment.in_progress;

    if (subsegment.parent) {
      subsegment.parent.decrementCounter()
    }

    // @ts-ignore Don't have a choice, we need to access a private proeprty, until they fix an issue. See above comment.
    if (subsegment.segment && subsegment.segment["counter"] > SegmentUtils.getStreamingThreshold()) {
      if (subsegment.streamSubsegments() && subsegment.parent) {
        subsegment.parent.removeSubsegment(subsegment)
      }
    }

    // End of the code ( close() function ) from the subsegment.js file of the aws-xray-sdk-core.
    if (this.debug) {
      this.loghandler.debug("X-Ray capture span", {
        span,
        segment,
        subsegment,
      })
    }

    return subsegment;
  }
}
