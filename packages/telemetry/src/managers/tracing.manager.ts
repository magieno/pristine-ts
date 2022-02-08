import {injectable, scoped, Lifecycle, injectAll, inject} from "tsyringe";
import {Trace} from "../models/trace.model";
import {Span} from "../models/span.model";
import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";
import {moduleScoped, tag, ServiceDefinitionTagEnum, TracingContext} from "@pristine-ts/common";
import {SpanKeynameEnum} from "../enums/span-keyname.enum";
import {TelemetryModuleKeyname} from "../telemetry.module.keyname";
import {TracerInterface} from "../interfaces/tracer.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";

/**
 * The Tracing Manager provides methods to help with tracing.
 * It is tagged and can be injected using TracingManagerInterface which facilitates mocking.
 * It is module scoped to the TelemetryModuleKeyname.
 */
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

    /**
     * The Tracing Manager provides methods to help with tracing.
     * It is tagged and can be injected using TracingManagerInterface which facilitates mocking.
     * It is module scoped to the TelemetryModuleKeyname.
     * @param tracers The tracers to use. All services tagged with ServiceDefinitionTagEnum.Tracer will be injected here.
     * @param loghandler The log handler to output logs.
     * @param isActive Whether or not tracing is activated.
     * @param debug Whether or not tracing is in debug mode, meaning that it should output logs with the debug severity about the trace and spans.
     * This can be set to false to prevent having to much logs for every single span created.
     * @param tracingContext The tracing context.
     */
    public constructor(@injectAll(ServiceDefinitionTagEnum.Tracer) private readonly tracers: TracerInterface[],
                       @inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface,
                       @inject("%pristine.telemetry.active%") private readonly isActive: boolean,
                       @inject("%pristine.telemetry.debug%") private readonly debug: boolean,
                       private readonly tracingContext: TracingContext,) {
    }

    /**
     * This methods starts the Tracing. This should be the first method called before doing anything else.
     * @param spanRootKeyname The keyname of the span at the root.
     * @param traceId The trace id if there is one.
     * @param context The context if there is one.
     */
    startTracing(spanRootKeyname: string = SpanKeynameEnum.RootExecution, traceId?: string, context?: { [key: string]: string }): Span {
        this.trace = new Trace(traceId, context);
        const span = new Span(spanRootKeyname, undefined, context);

        // Set the trace id into the Tracing Context. This can be used to retrieve the current trace.
        this.tracingContext.traceId = this.trace.id;

        // If the tracing is not active, simply return the created span but don't send to the tracers.
        if(this.isActive === false) {
            return span;
        }

        // Log that we are starting the tracing
        if(this.debug) {
            this.loghandler.debug("Start Tracing", {
                spanRootKeyname,
                traceId,
                context,
                trace: this.trace,
                span,
            }, TelemetryModuleKeyname)
        }

        // Call the tracers and push the trace that was just started
        this.tracers.forEach( (tracer:TracerInterface) => {
            tracer.traceStartedStream?.push(this.trace);
        })

        // Define the rootSpan of the trace as the newly created Span. This is the root span.
        this.trace.rootSpan = span;

        // Call the addSpan method to ensure that the span will be added.
        this.addSpan(span);

        return span;
    }

    /**
     * This method starts a new span.
     * @param keyname The keyname for this new span.
     * @param parentKeyname The keyname of the parent span.
     * @param context The context if there is one.
     */
    public startSpan(keyname: string, parentKeyname?: string, context?: any): Span {
        // Check if there's an active trace. If not, start one.
        if(this.trace === undefined) {
            this.startTracing(SpanKeynameEnum.RootExecution, undefined, context);
        }

        // Create the new span
        const span = new Span(keyname, context);
        span.trace = this.trace!;

        // Retrieve the parent and add it to the span.
        let parentSpan: Span = this.trace!.rootSpan!;

        // Check to find the parentKeyname in our internal map of spans. If n ot, the rootSpan will be the parent since every span
        // needs at least one parent.
        if(parentKeyname) {
            parentSpan = this.spans[parentKeyname] ?? parentSpan;
        }

        // Add the new span as a child of its parent.
        parentSpan.addChild(span);

        this.addSpan(span);

        return span;
    }

    /**
     * This methods adds an already created Span to the trace. It assumes that it its hierarchy is correct.
     * @param span The span to add.
     */
    public addSpan(span: Span): Span  {
        // Check if there's an active trace. If not, log an error and return;
        if(this.trace === undefined) {
            this.loghandler.error("You cannot call 'addSpan' without having an existing Trace.", {span}, TelemetryModuleKeyname);

            return span;
        }

        // Assign the tracing manager and the current trace to the span.
        span.tracingManager = this;
        span.trace = this.trace!;

        // Add it to the map of spans
        this.spans[span.keyname] = span;

        // If the tracing is deactivated, simply return the span and don't complain.
        if(this.isActive === false) {
            return span;
        }

        if(this.debug) {
            this.loghandler.debug("Adding the span", {
                keyname: span.keyname,
                trace: this.trace,
                span,
            }, TelemetryModuleKeyname)
        }

        // Notify the Tracers that a new span was started.
        this.tracers.forEach( (tracer:TracerInterface) => {
            tracer.spanStartedStream?.push(span);
        })

        // If this span already has child spans, add them.
        span.children.forEach(childSpan => this.addSpan(childSpan))

        return span;
    }

    /**
     * This method ends the span using a keyname.
     * @param keyname The keyname of the span to end.
     */
    public endSpanKeyname(keyname: string) {
        if(this.spans.hasOwnProperty(keyname) === false) {
            return;
        }

        this.endSpan(this.spans[keyname]);
    }

    /**
     * This methods ends the span by setting the end date and by calling the tracers.
     * It will also end the trace if the rootspan is being ended.
     * @param span The span to end.
     */
    public endSpan(span: Span) {
        if(span.inProgress === false) {
            return;
        }

        span.inProgress = false;

        // When a span is ended, all of its children are automatically ended as well.
        span.children.forEach(childSpan => this.endSpan(childSpan));

        if(span.endDate === undefined) {
            span.endDate = Date.now();
        }

        if(this.isActive === false) {
            return;
        }

        if(this.debug) {
            this.loghandler.debug("Ending the span", {
                trace: this.trace,
                span,
            }, TelemetryModuleKeyname)
        }

        // Notify the TraceListeners that the span was ended.
        this.tracers.forEach( (tracer:TracerInterface) => {
            tracer.spanEndedStream?.push(span);
        })

        // If the span is the root span, the trace has ended
        if(span.keyname === this.trace?.rootSpan?.keyname) {
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

        // End the trace by setting the end date.
        this.trace.endDate = Date.now();

        // End the trace.
        this.trace.hasEnded = true;

        // This method will recursively end all the spans
        if(this.trace.rootSpan !== undefined) {
            this.endSpan(this.trace.rootSpan);
        }

        if(this.isActive === false) {
            return;
        }

        // Notify the TraceListeners that the Trace was ended.
        this.tracers.forEach( (tracer:TracerInterface) => {
            tracer.traceEndedStream?.push(this.trace);
        })

        // Trace time
        // Top 5 longest spans
        let longestSpans = Object.values(this.spans).sort( (a, b) => b.getDuration() - a.getDuration());
        longestSpans.splice(5);

        this.loghandler.info("Ending the trace. \n" +
            "Trace duration: " + this.trace.getDuration() + " ms \n" +
            "Top 5 longest spans: \n" + longestSpans.map(span => "\t" + span.getDuration() + " ms - " + span.keyname).join("\n")
            , {
            trace: this.trace,
        }, TelemetryModuleKeyname)
    }
}
