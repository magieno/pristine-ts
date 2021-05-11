import {injectable, scoped, Lifecycle} from "tsyringe";
import {Trace} from "../models/trace.model";
import {Span} from "../models/span.model";
import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";
import {tag} from "@pristine-ts/common";

@tag("TracingManagerInterface")
@scoped(Lifecycle.ContainerScoped)
@injectable()
export class TracingManager implements TracingManagerInterface {
    trace: Trace

    public spans: {[id: string]: Span} = {};

    /**
     * This method starts the tracing
     */
    startTracing(traceId: string, context?: any) {

    }

    startSpan(id: string, parentId?: string, context?: any) {
        // Check if there's an active trace. If not, start one.

        // Check to find the parentId in our internal map of spans

        // If the parentSpan isn't found, simply add the current span to the Trace's root span

        // Notify the TraceListeners that a new span was started.
    }

    public endSpanId(id: string) {

    }

    public endSpan(span: Span) {
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
