import {Readable} from "stream";

/**
 * This interface represents what a tracer should have.
 */
export interface TracerInterface {
    /**
     * The stream for when a span is started.
     */
    spanStartedStream?: Readable;

    /**
     * The stream for when a span has ended.
     */
    spanEndedStream?: Readable;

    /**
     * The stream for when a trace is started.
     */
    traceStartedStream?: Readable;

    /**
     * The stream for when a trace has ended.
     */
    traceEndedStream?: Readable;
}
