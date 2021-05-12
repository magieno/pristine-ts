import {injectable, scoped, Lifecycle} from "tsyringe";
import {Trace} from "../models/trace.model";
import {Span} from "../models/span.model";
import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";
import {tag} from "@pristine-ts/common";
import { v4 as uuidv4 } from 'uuid';
import {SpanKeynameEnum} from "../enums/span-keyname.enum";

@tag("TracingManagerInterface")
@scoped(Lifecycle.ContainerScoped)
@injectable()
export class TracingManager implements TracingManagerInterface {
    trace: Trace

    public spans: {[keyname: string]: Span} = {};

    /**
     * This method starts the tracing
     */
    startTracing(spanRootKeyname: string = SpanKeynameEnum.RootExecution, traceId?: string, context?: any) {
        const trace = new Trace();
        trace.id = traceId ?? uuidv4();
        trace.context = context;

        const span = new Span(this);
        span.id = uuidv4();
        span.keyname = spanRootKeyname
        span.trace = trace;
        span.context = context;

        trace.rootSpan = span;

        this.spans[span.keyname] = span;
    }

    /**
     *
     * @param keyname
     * @param parentId
     * @param context
     */
    public startSpan(keyname: string, parentId?: string, context?: any) {
        // Check if there's an active trace. If not, start one.

        // Check to find the parentId in our internal map of spans

        // If the parentSpan isn't found, simply add the current span to the Trace's root span

        // Notify the TraceListeners that a new span was started.
    }

    public endSpanKeyname(keyname: string) {
        if(this.spans.hasOwnProperty(keyname) === false) {
            return;
        }

        this.endSpan(this.spans[keyname]);
    }

    public endSpan(span: Span) {
        span.endDate = Date.now();

        // Notify the TraceListeners that the span was ended.
    }

    // startSpan(name: string, parentSpanId?: string): Span {
    //     // Assume that if the parentSpanId is undefined,
    //     if(parentSpanId === undefined) {
    //
    //     }
    //
    //     const span = new Span();
    //
    //
    //     return span;
    // }
}
