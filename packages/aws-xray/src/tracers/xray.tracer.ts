import {injectable} from "tsyringe";
import {Span, Trace, TracerInterface} from "@pristine-ts/telemetry";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Readable} from "stream";
import AWSXRay, {Segment} from "aws-xray-sdk";
import {AwsXrayModuleKeyname} from "../aws-xray.module.keyname";

AWSXRay.enableManualMode();

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
        const segment = this.captureSpan(trace.rootSpan, trace);
        segment.flush();
    }

    /**
     * This method captures the spans recursively and creates the root segment.
     * @param span
     * @param trace
     * @private
     */
    private captureSpan(span: Span, trace: Trace): Segment {
        const segment = new AWSXRay.Segment(span.keyname);
        segment.id = span.id;
        segment.start_time = span.startDate;
        segment.end_time = span.endDate;
        segment.trace_id = trace.id;

        if(span.parentSpan) {
            segment.parent_id = span.parentSpan.id;
        }

        if(span.context) {
            Object.keys(span.context).forEach(key => {
                const value = span.context[key];
                if (value) {
                    segment.addMetadata(key, value);
                }
            })
        }

        span.childSpans?.forEach(childSpan => {
            this.captureSpan(childSpan, trace);
        })

        return segment;
    }
}
