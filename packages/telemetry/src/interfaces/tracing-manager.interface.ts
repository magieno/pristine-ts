import {Span} from "../models/span.model";
import {SpanKeynameEnum} from "../enums/span-keyname.enum";

export interface TracingManagerInterface {
    startTracing(spanRootKeyname?: string, traceId?: string, context?: any): Span;

    endTrace();

    startSpan(keyname: string, parentId?: string, context?: any): Span;

    addSpan(span: Span, parentId?: string, context?: any);

    endSpan(span: Span);
}
