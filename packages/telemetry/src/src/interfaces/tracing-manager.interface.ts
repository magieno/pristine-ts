import {Span} from "../models/span.model";
import {SpanKeynameEnum} from "../enums/span-keyname.enum";

export interface TracingManagerInterface {
    startTracing(spanRootKeyname?: string, traceId?: string, context?: any);

    endSpan(span: Span);
}
