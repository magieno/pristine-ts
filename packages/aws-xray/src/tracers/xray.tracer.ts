import {injectable, scoped, Lifecycle} from "tsyringe";
import {Span, Trace, TracerInterface} from "@pristine-ts/telemetry";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Readable} from "stream";
import AWSXRay, {Segment, Subsegment} from "aws-xray-sdk";
import {AwsXrayModuleKeyname} from "../aws-xray.module.keyname";

AWSXRay.enableManualMode();

@moduleScoped(AwsXrayModuleKeyname)
@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
@scoped(Lifecycle.ContainerScoped)
export class XrayTracer implements TracerInterface{
    segment: {[id: string]: Segment} = {};
    subsegmentMap: {[id: string]: Subsegment} = {};
    spanStartedStream: Readable;
    spanEndedStream: Readable;
    traceStartedStream: Readable;
    traceEndedStream: Readable;

    public constructor() {
        this.spanStartedStream = new Readable({
            objectMode: true,
            read(size: number) {
                return true;
            }
        });
        this.spanEndedStream = new Readable({
            objectMode: true,
            read(size: number) {
                return true;
            }
        });
        this.traceStartedStream = new Readable({
            objectMode: true,
            read(size: number) {
                return true;
            }
        });
        this.traceEndedStream = new Readable({
            objectMode: true,
            read(size: number) {
                return true;
            }
        });

        this.spanStartedStream.on('data', (span: Span) => {
            this.spanStarted(span);
        });

        this.spanEndedStream.on('data', (span: Span) => {
            this.spanEnded(span);
        });

        this.traceStartedStream.on('data', (trace: Trace) => {
            this.traceStarted(trace);
        });

        this.traceEndedStream.on('data', (trace: Trace) => {
            this.traceEnded(trace);
        });
    }

    private traceStarted(trace: Trace): Segment {
        console.log("XRay trace started")
        console.log(trace)

        const segment = new AWSXRay.Segment(trace.rootSpan.keyname);
        segment.id = trace.id;
        segment.trace_id = trace.id;

        if(trace.rootSpan.context) {
            Object.keys(trace.rootSpan.context).forEach(key => {
                const value = trace.rootSpan.context[key];
                if (value) {
                    segment.addMetadata(key, value);
                }
            })
        }

        this.segment[trace.id] = segment;
        console.log(segment)
        return segment;
    }

    /**
     * This method is called when the trace ends.
     * @param trace
     */
    private traceEnded(trace: Trace) {
        console.log("XRay trace ended")
        console.log(trace)
        this.segment[trace.id]?.close()
        this.segment[trace.id]?.flush();
    }

    private spanStarted(span: Span): Subsegment {
        console.log("XRay span started")
        console.log(span)

        const subsegment = new Subsegment(span.keyname);
        subsegment.id = span.id;

        if(span.context) {
            Object.keys(span.context).forEach(key => {
                const value = span.context[key];
                if (value) {
                    subsegment.addMetadata(key, value);
                }
            })
        }

        if(span.parentSpan) {
            this.subsegmentMap[span.parentSpan.id]?.addSubsegment(subsegment);
        } else {
            this.segment[span.trace.id]?.addSubsegment(subsegment);
        }

        this.subsegmentMap[subsegment.id] = subsegment;

        console.log(subsegment)

        return subsegment;
    }

    private spanEnded(span: Span) {
        console.log("XRay span ended")
        console.log(span)
        console.log(this.subsegmentMap[span.id])

        this.subsegmentMap[span.id].close();
    }
}
