import "reflect-metadata";
import {ObservabilityPaths} from "./observability-paths";

describe("ObservabilityPaths", () => {
  it("resolves the store layout from the configured directory", () => {
    const paths = new ObservabilityPaths("/tmp/store");
    expect(paths.root).toBe("/tmp/store");
    expect(paths.instanceDirectory("i1")).toBe("/tmp/store/i1");
    expect(paths.logsFile("i1")).toBe("/tmp/store/i1/logs.jsonl");
    expect(paths.requestsFile("i1")).toBe("/tmp/store/i1/requests.jsonl");
    expect(paths.tracesDirectory("i1")).toBe("/tmp/store/i1/traces");
    expect(paths.traceFile("i1", "t1")).toBe("/tmp/store/i1/traces/t1.json");
    expect(paths.pidFile("i1")).toBe("/tmp/store/i1/pid");
  });

  it("names rotated generations beside the live file", () => {
    const paths = new ObservabilityPaths("/tmp/store");
    const logsFile = paths.logsFile("i1");

    expect(ObservabilityPaths.rotated(logsFile, 0)).toBe(logsFile);
    expect(ObservabilityPaths.rotated(logsFile, 1)).toBe("/tmp/store/i1/logs.1.jsonl");
    expect(ObservabilityPaths.rotated(logsFile, 12)).toBe("/tmp/store/i1/logs.12.jsonl");
    expect(ObservabilityPaths.rotated(paths.requestsFile("i1"), 2)).toBe("/tmp/store/i1/requests.2.jsonl");
  });

  it("resolves a relative configured directory against process.cwd()", () => {
    const paths = new ObservabilityPaths(".pristine/observability");
    expect(paths.root.startsWith("/")).toBe(true);
    expect(paths.root.endsWith(".pristine/observability")).toBe(true);
  });
});
