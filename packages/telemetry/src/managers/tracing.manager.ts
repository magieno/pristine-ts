import {injectable, scoped, Lifecycle, injectAll, inject} from "tsyringe";
import {Trace} from "../models/trace.model";
import {Span} from "../models/span.model";
import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";
import {moduleScoped, tag, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import { v4 as uuidv4 } from 'uuid';
import {SpanKeynameEnum} from "../enums/span-keyname.enum";
import {TelemetryModuleKeyname} from "../telemetry.module.keyname";
import {TracerInterface} from "../interfaces/tracer.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";

@moduleScoped(TelemetryModuleKeyname)
@tag("TracingManagerInterface")
@scoped(Lifecycle.ContainerScoped)
@injectable()
export class TracingManager implements TracingManagerInterface {
    /**
     * This property contains a reference to the active trace.
     */
    public trace?: Trace

    /**
     * This object contains a map of all the spans sorted by their keyname.
     */
    public spans: {[keyname: string]: Span} = {};

    public constructor(@injectAll(ServiceDefinitionTagEnum.Tracer) private readonly tracers: TracerInterface[],
                       @inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface) {
    }

    /**
     * This methods starts the Tracing. This should be the first method called before doing anything else.
     *
     * @param spanRootKeyname
     * @param traceId
     * @param context
     */
    startTracing(spanRootKeyname: string = SpanKeynameEnum.RootExecution, traceId?: string, context?: any): Span {
        this.trace = new Trace();
        this.trace.id = traceId ?? uuidv4();
        this.trace.context = context ?? this.trace.context;

        const span = new Span(this);
        span.id = uuidv4();
        span.keyname = spanRootKeyname
        span.trace = this.trace;
        span.context = context ?? span.context;

        this.trace.rootSpan = span;

        this.spans[span.keyname] = span;

        // Log that we are starting the tracing
        this.loghandler.debug("Start Tracing", {
            spanRootKeyname,
            traceId,
            context,
            trace: this.trace,
            span,
        })

        this.tracers.forEach( (tracer:TracerInterface) => {
            this.loghandler.debug("Pushing the trace into the traceStartedStream.", {
                tracer,
                trace: this.trace,
            });

            tracer.traceStartedStream?.push(this.trace);
        })

        // Notify the Tracers that a new span was started.
        this.tracers.forEach( (tracer:TracerInterface) => {
            this.loghandler.debug("Pushing the span into the spanStartedStream.", {
                tracer,
                trace: this.trace,
                span,
            });

            tracer.spanStartedStream?.push(span);
        })

        return span;
    }

    /**
     * This method starts a new span.
     *
     * @param keyname
     * @param parentId
     * @param context
     */
    public startSpan(keyname: string, parentId?: string, context?: any): Span {
        // Check if there's an active trace. If not, start one.
        if(this.trace === undefined) {
            this.startTracing(SpanKeynameEnum.RootExecution, undefined, context);
        }

        let parentSpan: Span = this.trace!.rootSpan;

        // Check to find the parentId in our internal map of spans
        if(parentId) {
            parentSpan = this.spans[parentId] ?? parentSpan;
        }

        // Create the new span
        const span = new Span(this);
        span.id = uuidv4();
        span.keyname = keyname
        span.trace = this.trace!;
        span.context = context ?? span.context;
        span.parentSpan = parentSpan;
        parentSpan.childSpans.push(span);

        // Add it to the map of spans
        this.spans[span.keyname] = span;

        this.loghandler.debug("Start Span", {
            keyname,
            parentId,
            context,
            trace: this.trace,
            span,
        })

        // Notify the Tracers that a new span was started.
        this.tracers.forEach( (tracer:TracerInterface) => {
            this.loghandler.debug("Pushing the span into the spanStartedStream.", {
                keyname,
                parentId,
                context,
                trace: this.trace,
                span,
                tracer,
            })

            tracer.spanStartedStream?.push(span);
        })

        return span;
    }

    /**
     * This method ends the span using a keyname.
     *
     * @param keyname
     */
    public endSpanKeyname(keyname: string) {
        if(this.spans.hasOwnProperty(keyname) === false) {
            return;
        }

        this.endSpan(this.spans[keyname]);
    }

    /**
     * This methods ends the span by setting the end date and by calling the tracers.
     *
     * It will also end the trace if the rootspan is being ended.
     *
     * @param span
     */
    public endSpan(span: Span) {
        if(span.endDate !== undefined) {
            return;
        }

        span.endDate = Date.now();

        this.loghandler.debug("End Span", {
            trace: this.trace,
            span,
        })

        // Notify the TraceListeners that the span was ended.
        this.tracers.forEach( (tracer:TracerInterface) => {
            this.loghandler.debug("Pushing the span into the spanEndedStream.", {
                trace: this.trace,
                span,
                tracer,
            })

            tracer.spanEndedStream?.push(span);
        })

        // If the span is the root span, the trace has ended
        if(span.keyname === this.trace?.rootSpan.keyname) {
            this.endTrace()
        }
    }

    /**
     * This method ends the trace entirely.
     */
    public endTrace() {
        if(this.trace === undefined || this.trace.hasEnded) {
            return;
        }

        // End the trace.
        this.trace.hasEnded = true;

        // Loop over all the spans and end them if they are not already ended.
        Object.keys(this.spans).forEach(spanKeyname => {
            this.endSpan(this.spans[spanKeyname]);
        });

        // End the trace by setting the end date.
        this.trace.endDate = Date.now();

        this.loghandler.debug("End Trace", {
            trace: this.trace,
        })

        // Notify the TraceListeners that the span was ended.
        this.tracers.forEach( (tracer:TracerInterface) => {
            this.loghandler.debug("Pushing the tracer into the traceEndedStream.", {
                trace: this.trace,
                tracer,
            })

            tracer.traceEndedStream?.push(this.trace);
        })
    }
}
