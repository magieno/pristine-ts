import {Trace} from "./trace.model";
import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";
import { v4 as uuidv4 } from 'uuid';

export class Span {
    public id: string;

    public tracingManager?: TracingManagerInterface

    public trace: Trace;

    public startDate: number = Date.now();

    public endDate?: number;

    public parentSpan?: Span;

    public childSpans: Span[] = [];

    public context: { [key: string]: string } = {};

    public inProgress = true;

    public constructor(public keyname: string, id?: string) {
        this.id = id ?? uuidv4();
    }

    public getDuration(): number {
        return (this.endDate ?? Date.now()) - this.startDate;
    }

    public end() {
        this.tracingManager?.endSpan(this);
    }

    public setTrace(trace: Trace) {
        this.trace = trace;

        this.childSpans.forEach(childSpan => childSpan.setTrace(trace));
    }

    public addChild(span: Span) {
        const existingChildSpan = this.childSpans.find(childSpan => childSpan.id === span.id);

        if(existingChildSpan) {
            return;
        }

        span.parentSpan = this;
        this.childSpans.push(span);
    }
}
