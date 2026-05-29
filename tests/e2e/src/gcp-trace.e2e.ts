import "reflect-metadata";
import {container} from "tsyringe";
import {CloudTraceTracer} from "@pristine-ts/gcp-trace";

const noopLog = {debug: () => {}, info: () => {}, warning: () => {}, error: () => {}, critical: () => {}, terminate: () => {}};

describe("GCP Cloud Trace tracer (E2E)", () => {
    beforeEach(() => container.clearInstances());

    it("can be constructed even when deactivated", () => {
        const tracer = new CloudTraceTracer(false, false, false, "test-project", noopLog as any);
        expect(tracer.traceEndedStream).toBeDefined();
    });

    it("when deactivated, dropping a trace on the stream does NOT touch the exporter", (done) => {
        const tracer = new CloudTraceTracer(false, false, /* activated */ false, "test-project", noopLog as any);
        // Push a synthetic trace through the stream — if the tracer tried to export when
        // deactivated, it would crash trying to construct a real GCP client. Reaching the
        // 'data' listener's early-return path means we silently drop the trace.
        tracer.traceEndedStream.push({id: "t1", rootSpan: undefined});
        // Give the listener a microtask to fire.
        setImmediate(() => {
            // No crash → test passes.
            done();
        });
    });

    it("when activated but rootSpan is undefined, error is logged and no export attempted", (done) => {
        let errorLogged = false;
        const log = {...noopLog, error: () => { errorLogged = true; }};
        const tracer = new CloudTraceTracer(false, false, /* activated */ true, "test-project", log as any);
        tracer.traceEndedStream.push({id: "t1", rootSpan: undefined});
        setImmediate(() => {
            expect(errorLogged).toBe(true);
            done();
        });
    });
});
