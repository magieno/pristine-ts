import "reflect-metadata";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {FileTracer} from "./file.tracer";
import {ConsoleTracerOutputModeEnum} from "../enums/console-tracer-output-mode.enum";
import {Trace} from "../models/trace.model";
import {Span} from "../models/span.model";

function buildTracer(opts: {
  activated: boolean;
  outputMode: ConsoleTracerOutputModeEnum;
  directory: string;
  filenamePattern?: string;
}): FileTracer {
  const logHandler: any = {error: jest.fn(), warning: jest.fn(), info: jest.fn(), debug: jest.fn(), critical: jest.fn(), notice: jest.fn(), terminate: jest.fn()};
  return new FileTracer(
    opts.activated,
    opts.outputMode,
    opts.directory,
    opts.filenamePattern ?? "<traceId>.json",
    logHandler,
  );
}

function buildTrace(id = "trace-abc"): Trace {
  const trace = new Trace(id);
  trace.startDate = 1000;
  trace.endDate = 1450;
  const root = new Span("root", "root-id");
  root.startDate = 1000;
  root.endDate = 1450;
  trace.rootSpan = root;
  return trace;
}

describe("FileTracer", () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // realpathSync is needed because on macOS, mkdtemp returns `/var/...` but
    // process.cwd() after chdir returns the resolved `/private/var/...` — and the
    // FileTracer writes relative to process.cwd(). Comparing the two paths directly
    // would fail spuriously.
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "pristine-file-tracer-test-")));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, {recursive: true, force: true});
  });

  it("does nothing when deactivated", () => {
    const tracer = buildTracer({activated: false, outputMode: ConsoleTracerOutputModeEnum.Json, directory: "./traces"});
    tracer.traceEndedStream?.emit("data", buildTrace());
    expect(fs.existsSync(path.join(tmpDir, "traces"))).toBe(false);
  });

  it("writes one file per trace named after the trace id", () => {
    const tracer = buildTracer({activated: true, outputMode: ConsoleTracerOutputModeEnum.Json, directory: "./traces"});
    tracer.traceEndedStream?.emit("data", buildTrace("trace-1"));
    tracer.traceEndedStream?.emit("data", buildTrace("trace-2"));

    const dir = path.join(tmpDir, "traces");
    expect(fs.existsSync(path.join(dir, "trace-1.json"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "trace-2.json"))).toBe(true);

    const parsed = JSON.parse(fs.readFileSync(path.join(dir, "trace-1.json"), "utf8"));
    expect(parsed.id).toBe("trace-1");
    expect(parsed.duration).toBe(450);
    expect(parsed.rootSpan.keyname).toBe("root");
  });

  it("respects a custom filename pattern with date and timestamp placeholders", () => {
    const tracer = buildTracer({
      activated: true,
      outputMode: ConsoleTracerOutputModeEnum.Tree,
      directory: "./traces",
      filenamePattern: "<date>/<timestamp>-<traceId>.txt",
    });

    const trace = buildTrace("trace-xyz");
    trace.endDate = Date.UTC(2026, 4, 13, 10, 0, 0);  // 2026-05-13 (month is 0-indexed)
    tracer.traceEndedStream?.emit("data", trace);

    const expectedDir = path.join(tmpDir, "traces", "2026-05-13");
    expect(fs.existsSync(expectedDir)).toBe(true);
    const files = fs.readdirSync(expectedDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^\d+-trace-xyz\.txt$/);
    const content = fs.readFileSync(path.join(expectedDir, files[0]), "utf8");
    expect(content).toContain("Trace trace-xyz");
    expect(content).toContain("root");
  });

  it("creates the directory on demand if it doesn't exist", () => {
    const tracer = buildTracer({
      activated: true,
      outputMode: ConsoleTracerOutputModeEnum.Json,
      directory: "./deeply/nested/traces",
    });
    tracer.traceEndedStream?.emit("data", buildTrace());
    expect(fs.existsSync(path.join(tmpDir, "deeply", "nested", "traces", "trace-abc.json"))).toBe(true);
  });

  it("absorbs a write failure rather than throwing", () => {
    // Point the directory at a path that can't be created (a file, not a directory).
    const blockingFile = path.join(tmpDir, "blocked");
    fs.writeFileSync(blockingFile, "");
    const tracer = buildTracer({
      activated: true,
      outputMode: ConsoleTracerOutputModeEnum.Json,
      directory: blockingFile + "/inside",   // can't mkdir under a regular file
    });
    const stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    try {
      expect(() => tracer.traceEndedStream?.emit("data", buildTrace())).not.toThrow();
      expect(stderrSpy).toHaveBeenCalled();
      expect(stderrSpy.mock.calls[0][0]).toContain("[pristine][tracer:FileTracer]");
    } finally {
      stderrSpy.mockRestore();
    }
  });
});
