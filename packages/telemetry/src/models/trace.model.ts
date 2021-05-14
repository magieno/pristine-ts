import {Span} from "./span.model";

export class Trace {
    public id: string;

    public startDate: number = Date.now();

    public endDate?: number;

    public getDuration(): number {
        return (this.endDate ?? Date.now()) - this.startDate;
    }

    public rootSpan: Span;

    public context?: any;

    public hasEnded: boolean = false;
}
