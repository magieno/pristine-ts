import {Trace} from "./trace.model";
import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";

export class Span {
    public id: string;

    public trace: Trace;

    public startDate: number;

    public endDate?: number;

    public parentSpan?: Span;

    public childSpans: Span[] = [];

    public context?: any;


    public constructor(private readonly tracingManagerInterface: TracingManagerInterface) {
    }

    public getDuration(): number {
        return (this.endDate ?? Date.now()) - this.startDate;
    }

    public end() {
        this.tracingManagerInterface.endSpan(this);
    }
}
