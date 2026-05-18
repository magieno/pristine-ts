import {Span, Trace, TracingManagerInterface} from "@pristine-ts/telemetry";

export class TracingManagerMock implements TracingManagerInterface {
    trace?: Trace;

    addSpan(span: Span): Span {
        return span;
    }

    endSpan(span: Span): void {
    }

    endSpanKeyname(keyname: string): void {
    }

    endTrace(): void {
    }

    startSpan(keyname: string, parentKeyname?: string, parentId?: string, context?: { [p: string]: string }): Span {
        return new Span("");
    }

    startTracing(spanRootKeyname?: string, traceId?: string, context?: { [p: string]: string }): Span {
        const trace = new Trace();

        return new Span("");
    }

    addEventToCurrentSpan(message: string, attributes?: { [p: string]: string }): void {
    }

    getCurrentTrail(): Array<{
        kind: "span" | "event";
        name: string;
        date: Date;
        attributes: { [key: string]: string };
    }> {
        return [];
    }
}
