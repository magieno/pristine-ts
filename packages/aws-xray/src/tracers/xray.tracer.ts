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
        const segment = AWSXRay.getSegment() as Segment;
        this.captureSpan(trace.rootSpan, segment);
        segment.close()
        segment.flush()

        console.log("Xray trace ended")
        console.log(trace);
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
        subsegment["end_time"] = span.endDate? span.endDate / 1000: Date.now() / 1000;
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

        segment.addSubsegment(subsegment);

        span.childSpans?.forEach(childSpan => {
            console.log("Xray Child span")
            console.log(childSpan);
            this.captureSpan(childSpan, subsegment);
        })

        subsegment.close();
        return subsegment;
    }
}