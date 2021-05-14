import {Span} from "../models/span.model";
import {Readable} from "stream";

export interface TracerInterface {
    spanStartedStream: Readable;
    spanEndedStream: Readable;
    traceEndedStream: Readable;
}
