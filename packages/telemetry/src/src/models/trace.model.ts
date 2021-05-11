import {Span} from "./span.model";

export class Trace {
    public id: string;

    public name: string;

    public startDate: number;

    public endDate?: number;

    public getDuration(): number {
        return (this.endDate ?? Date.now()) - this.startDate;
    }

    public rootSpan: Span;

    public context?: any;
}
