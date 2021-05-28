import {injectable, scoped, Lifecycle} from "tsyringe";
import {Span, Trace, TracerInterface} from "@pristine-ts/telemetry";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Readable} from "stream";
import AWSXRay, {Segment, Subsegment} from "aws-xray-sdk";
import {AwsXrayModuleKeyname} from "../aws-xray.module.keyname";

@moduleScoped(AwsXrayModuleKeyname)
@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
export class XrayTracer implements TracerInterface{
    traceEndedStream: Readable;

    public constructor() {
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
        const segment = this.captureRoot(trace);
        this.captureSpan(trace.rootSpan, segment);
    }

    private captureRoot(trace: Trace): Segment {
        const segment = AWSXRay.getSegment() as Segment;
        segment.id = trace.id;
        segment.start_time = trace.startDate;
        segment.end_time = trace.endDate;
        segment.trace_id = trace.id;

        return segment;
    }

    /**
     * This method captures the spans recursively and creates the root segment.
     * @param span
     * @param segment
     * @private
     */
    private captureSpan(span: Span, segment: Segment | Subsegment): Subsegment {
        const subsegment = new Subsegment(span.id);
        subsegment.start_time = span.startDate;
        subsegment["end_time"] = span.endDate;
        segment.addSubsegment(subsegment);

        if(span.context) {
            Object.keys(span.context).forEach(key => {
                const value = span.context[key];
                if (value) {
                    subsegment.addMetadata(key, value);
                }
            })
        }

        span.childSpans?.forEach(childSpan => {
            this.captureSpan(childSpan, segment);
        })

        return subsegment;
    }
}