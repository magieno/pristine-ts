import "reflect-metadata";
import {TracingManager} from "./tracing.manager";
import {SpanKeynameEnum} from "../enums/span-keyname.enum";
import {TracerInterface} from "../interfaces/tracer.interface";
import {Readable} from "stream";

describe("Tracing Manager", () => {
    it("should start the tracing by creating the trace and the root span", () => {
        const tracingManager: TracingManager = new TracingManager([]);

        tracingManager.startTracing();

        expect(tracingManager.trace).toBeDefined();
        expect(tracingManager.spans[SpanKeynameEnum.RootExecution]).toBeDefined();
    })

    it("should call the tracers when the startSpan method is called", async () => {
        let i = 0;

        return new Promise<void>(resolve => {

            // @ts-ignore
            const tracer: TracerInterface = {
                spanStartedStream: (() => {
                    const readableStream = new Readable({
                        objectMode: true,
                        read(size: number) {
                            return true;
                        }
                    });
                    readableStream.on('data', chunk => {
                        if(i == 0) {
                            expect(chunk.keyname).toBe("root.execution");
                        }
                        else if(i == 1) {
                            expect(chunk.keyname).toBe("SpanKeyname");
                        }

                        i++;
                        resolve();
                    });

                    return readableStream;
                })(),
            }

            const tracingManager: TracingManager = new TracingManager([tracer]);

            tracingManager.startTracing();
            expect.assertions(2);
            tracingManager.startSpan("SpanKeyname");


        })
    })

    it("should call the tracers when the endSpan method is called", async () => {
        return new Promise<void>(resolve => {

            // @ts-ignore
            const tracer: TracerInterface = {
                spanEndedStream: (() => {
                    const readableStream = new Readable({
                        objectMode: true,
                        read(size: number) {
                            return true;
                        }
                    });
                    readableStream.on('data', chunk => {
                            expect(chunk.keyname).toBe("SpanKeyname");

                        resolve();
                    });

                    return readableStream;
                })(),
                spanStartedStream: new Readable({
                    objectMode: true,
                    read(size: number) {
                        return true;
                    }
                }),
            }

            const tracingManager: TracingManager = new TracingManager([tracer]);

            tracingManager.startTracing();

            tracingManager.startSpan("SpanKeyname");
            tracingManager.endSpanKeyname("SpanKeyname");

            expect.assertions(1);
        })
    })

    it("should call the tracers when the endTrace method is called", async () => {
        return new Promise<void>(resolve => {

            const tracer: TracerInterface = {
                spanStartedStream: new Readable({
                    objectMode: true,
                    read(size: number) {
                        return true;
                    }
                }),
                spanEndedStream: new Readable({
                    objectMode: true,
                    read(size: number) {
                        return true;
                    }
                }),
                traceEndedStream: (() => {
                    const readableStream = new Readable({
                        objectMode: true,
                        read(size: number) {
                            return true;
                        }
                    });
                    readableStream.on('data', chunk => {
                        expect(chunk.rootSpan.keyname).toBe(SpanKeynameEnum.RootExecution);
                        resolve();
                    });

                    return readableStream;
                })(),
            }

            const tracingManager: TracingManager = new TracingManager([tracer]);

            tracingManager.startTracing();
            tracingManager.endTrace();

            expect(tracingManager.trace!.endDate).toBeDefined();

            expect.assertions(2);
        })
    })
});
