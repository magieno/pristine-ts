import {Span} from "./span.model";
import { v4 as uuidv4 } from 'uuid';

export class Trace {
    public id: string;

    public startDate: number = Date.now();

    public endDate?: number;

    public rootSpan?: Span;

    public context?: { [key: string]: string } = {};

    public hasEnded: boolean = false;

    public constructor(id?: string, context?: { [key: string]: string }) {
        this.id = id ?? uuidv4();
        this.context = context ?? {};
    }

    /**
     * This returns the duration of the trace in miliseconds.
     */
    public getDuration(): number {
        return (this.endDate ?? Date.now()) - this.startDate;
    }
}
