import "reflect-metadata";
import {Span, Trace} from "@pristine-ts/common";
import {SerializedTrace, TraceDeserializer} from "./trace-deserializer";

describe("TraceDeserializer", () => {
  it("rehydrates a stored trace into Trace/Span instances", () => {
    const serialized: SerializedTrace = {
      id: "trace-9",
      startDate: 100,
      endDate: 250,
      context: {"http.method": "POST"},
      rootSpan: {
        id: "s0",
        keyname: "root.execution",
        startDate: 100,
        endDate: 250,
        context: {},
        children: [
          {id: "s1", keyname: "router.request.execution", startDate: 110, endDate: 240, context: {}, children: []},
        ],
      },
    };

    const trace = TraceDeserializer.deserialize(serialized);
    expect(trace).toBeInstanceOf(Trace);
    expect(trace.id).toBe("trace-9");
    expect(trace.getDuration()).toBe(150);
    expect(trace.rootSpan).toBeInstanceOf(Span);
    expect(trace.rootSpan!.children).toHaveLength(1);
    expect(trace.rootSpan!.children[0].keyname).toBe("router.request.execution");
    expect(trace.rootSpan!.children[0].getDuration()).toBe(130);
  });
});
