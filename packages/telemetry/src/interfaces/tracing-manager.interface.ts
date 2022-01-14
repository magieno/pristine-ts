import {Span} from "../models/span.model";
import {SpanKeynameEnum} from "../enums/span-keyname.enum";
import {Trace} from "../models/trace.model";

export interface TracingManagerInterface {
    trace?: Trace

    startTracing(spanRootKeyname?: string, traceId?: string, context?: { [key: string]: string }): Span;

    endTrace(): void;

    startSpan(keyname: string, parentKeyname?: string, context?: { [key: string]: string }): Span;

    addSpan(span: Span): Span;

    endSpan(span: Span): void;
}
