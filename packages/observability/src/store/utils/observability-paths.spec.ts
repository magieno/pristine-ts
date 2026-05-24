import "reflect-metadata";
import {ObservabilityPaths} from "./observability-paths";

describe("ObservabilityPaths", () => {
  it("resolves the store layout from the configured directory", () => {
    const paths = new ObservabilityPaths("/tmp/store");
    expect(paths.root).toBe("/tmp/store");
    expect(paths.runDirectory("r1")).toBe("/tmp/store/runs/r1");
    expect(paths.logsFile("r1")).toBe("/tmp/store/runs/r1/logs.jsonl");
    expect(paths.requestsFile("r1")).toBe("/tmp/store/runs/r1/requests.jsonl");
    expect(paths.traceFile("r1", "t1")).toBe("/tmp/store/runs/r1/traces/t1.json");
    expect(paths.latestPointerFile()).toBe("/tmp/store/latest.json");
  });
});
