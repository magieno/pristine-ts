import {Trace} from "./trace.model";
import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";
import { v4 as uuidv4 } from 'uuid';

/**
 * This model represents a span.
 */
export class Span {
    /**
     * The unique id of the span.
     */
    public id: string;

    /**
     * The tracing manager.
     */
    public tracingManager?: TracingManagerInterface

    /**
     * The trace the span is attached to.
     */
    public trace?: Trace;

    /**
     * The timestamp in milliseconds at which the span was started.
     */
    public startDate: number = Date.now();

    /**
     * The timestamp in milliseconds at which the span was ended.
     */
    public endDate?: number;

    /**
     * The parent span.
     */
    public parentSpan?: Span;

    /**
     * The children spans.
     */
    public children: Span[] = [];

    /**
     * The context associated with the span.
     */
    public context: { [key: string]: string } = {};

    /**
     * Whether or not the span is in progress, meaning it has not ended.
     */
    public inProgress = true;

    /**
     * This model represents a span.
     * @param keyname The keyname of the span.
     * @param id The unique id of the span.
     * @param context The context to associate with the span.
     */
    public constructor(public keyname: string, id?: string, context?: { [key: string]: string }) {
        this.id = id ?? uuidv4();
        this.context = context ?? {};
    }

    /**
     * This method returns the duration of the span in milliseconds.
     */
    public getDuration(): number {
        return (this.endDate ?? Date.now()) - this.startDate;
    }

    /**
     * This method ends the span.
     */
    public end(): void {
        this.tracingManager?.endSpan(this);
    }

    /**
     * This method sets the trace for the span and all of its children.
     * @param trace The trace the span should be attached to.
     */
    public setTrace(trace: Trace): void {
        this.trace = trace;

        this.children.forEach(childSpan => childSpan.setTrace(trace));
    }

    /**
     * This method adds a child span to the current span. It only adds it if it's not already part of the children.
     * @param span The span to add as a child.
     */
    public addChild(span: Span): void {
        const existingChildSpan = this.children.find(childSpan => childSpan.id === span.id);

        if(existingChildSpan) {
            return;
        }

        span.parentSpan = this;
        this.children.push(span);
    }
}
