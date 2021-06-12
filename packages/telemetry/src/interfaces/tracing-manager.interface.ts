import {Span} from "../models/span.model";
import {SpanKeynameEnum} from "../enums/span-keyname.enum";
import {Trace} from "../models/trace.model";

export interface TracingManagerInterface {
    trace?: Trace

    startTracing(spanRootKeyname?: string, traceId?: string, context?: any): Span;

    endTrace();

    startSpan(keyname: string, parentId?: string, context?: any): Span;

    addSpan(span: Span, parentId?: string, context?: any);

    endSpan(span: Span);
}
