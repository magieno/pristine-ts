import {Span} from "../models/span.model";

export interface TracingManagerInterface {
    endSpan(span: Span);
}
