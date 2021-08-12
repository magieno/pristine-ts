import {injectable, scoped, Lifecycle, inject} from "tsyringe";
import {Span, Trace, TracerInterface} from "@pristine-ts/telemetry";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Readable} from "stream";
import AWSXRay, {Segment, Subsegment} from "aws-xray-sdk";
import {AwsXrayModuleKeyname} from "../aws-xray.module.keyname";
import {LogHandlerInterface} from "@pristine-ts/logging";

/**
 * Tracer to be able to dump Pristine traces to AWS Xray
 */
@moduleScoped(AwsXrayModuleKeyname)
@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
export class XrayTracer implements TracerInterface{
    traceEndedStream: Readable;

    public constructor(@inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface) {
        this.traceEndedStream = new Readable({
            objectMode: true,
            read(size: number) {
                return true;
            }
        });

        this.traceEndedStream.on('data', (trace: Trace) => {
            this.traceEnded(trace);
        });
    }

    /**
     * This method is called when the trace ends.
     * @param trace
     */
    private traceEnded(trace: Trace) {
        let segment = AWSXRay.getSegment() as Segment;

        if(segment === undefined) {
            segment = new AWSXRay.Segment(trace.id);
        }

        const subsegment = this.captureSpan(trace.rootSpan, segment);

        segment.flush()
        this.loghandler.debug("X-Ray trace ended", {
            segment,
            subsegment,
            trace,
        })
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
        subsegment.addMetadata("trace_id", span.trace.id);

        if(span.context) {
            Object.keys(span.context).forEach(key => {
                const value = span.context[key];
                if (value) {
                    subsegment.addMetadata(key, value);
                }
            })
        }

        this.loghandler.debug("X-Ray capture span", {
            span,
            segment,
            subsegment,
        })

        span.childSpans?.forEach(childSpan => {
            this.loghandler.debug("X-Ray before capturing span", {
                span,
                segment,
                subsegment,
                childSpan,
            })

            this.captureSpan(childSpan, segment);
        });

        segment.addSubsegment(subsegment);
        subsegment.close()

        // Force to rewrite the end time after closing it
        subsegment["end_time"] = span.endDate ? (span.endDate / 1000) : (Date.now() / 1000);

        return subsegment;
    }
}
