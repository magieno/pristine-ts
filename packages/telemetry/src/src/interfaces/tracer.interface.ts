import {Span} from "../models/span.model";

export interface TracerInterface {
    addSpan(span: Span);
}
