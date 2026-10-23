import "reflect-metadata";
import {TraceParentParser} from "./trace-parent.parser";

describe("TraceParentParser", () => {
  it("parses a valid traceparent and returns the trace id as a UUID", () => {
    const traceParent = TraceParentParser.parse("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");

    expect(traceParent).toBeDefined();
    expect(traceParent!.traceId).toBe("4bf92f35-77b3-4da6-a3ce-929d0e0e4736");
    expect(traceParent!.parentSpanId).toBe("00f067aa0ba902b7");
    expect(traceParent!.isSampled).toBe(true);
  });

  it("reads the sampled flag from the lowest bit of the flags", () => {
    expect(TraceParentParser.parse("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00")!.isSampled).toBe(false);
    expect(TraceParentParser.parse("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-03")!.isSampled).toBe(true);
  });

  it("ignores surrounding whitespace", () => {
    expect(TraceParentParser.parse("  00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01 ")).toBeDefined();
  });

  it("accepts extra fields from a later version", () => {
    expect(TraceParentParser.parse("01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01-future")).toBeDefined();
  });

  it.each([
    ["undefined", undefined],
    ["an empty string", ""],
    ["too few fields", "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7"],
    ["extra fields in version 00", "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01-extra"],
    ["the forbidden version ff", "ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"],
    ["an all-zero trace id", "00-00000000000000000000000000000000-00f067aa0ba902b7-01"],
    ["an all-zero parent id", "00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01"],
    ["an uppercase trace id", "00-4BF92F3577B34DA6A3CE929D0E0E4736-00f067aa0ba902b7-01"],
    ["a short trace id", "00-4bf92f3577b34da6a3ce929d0e0e47-00f067aa0ba902b7-01"],
    ["a non-hex parent id", "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902bz-01"],
    ["invalid flags", "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-1"],
  ])("returns undefined for %s", (_label, value) => {
    expect(TraceParentParser.parse(value)).toBeUndefined();
  });
});
