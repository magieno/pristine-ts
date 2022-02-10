import {Span} from "./span.model";
import { v4 as uuidv4 } from 'uuid';

/**
 * This model represents a trace.
 */
export class Trace {
    /**
     * The unique id of the trace.
     */
    public id: string;

    /**
     * The timestamp in milliseconds at which the trace was started.
     */
    public startDate: number = Date.now();

    /**
     * The timestamp in milliseconds at which the trace was ended.
     */
    public endDate?: number;

    /**
     * The span that is at the root.
     */
    public rootSpan?: Span;

    /**
     * The context associated with the trace.
     */
    public context?: { [key: string]: string } = {};

    /**
     * Whether or not the trace was ended.
     */
    public hasEnded: boolean = false;

    /**
     * This model represents a trace.
     * @param id The unique id of the trace.
     * @param context The context associated with the trace.
     */
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
