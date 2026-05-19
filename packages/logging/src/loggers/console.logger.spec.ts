import "reflect-metadata"
import {ConsoleLogger} from "./console.logger";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {OutputModeEnum} from "../enums/output-mode.enum";
import {StreamEnum} from "../enums/stream.enum";
import {Utils} from "../utils/utils";

/**
 * Builds a ConsoleLogger with sensible defaults for tests. `overrides` lets a specific
 * test override the streams map or any other ctor arg without re-listing 19 positional
 * parameters every time.
 */
function buildLogger(overrides: Partial<{
  threshold: SeverityEnum;
  numberOfStackedLogs: number;
  streams: Partial<Record<SeverityEnum, StreamEnum>>;
}> = {}) {
  const baseStreams: Record<SeverityEnum, StreamEnum> = {
    [SeverityEnum.Debug]: StreamEnum.Stdout,
    [SeverityEnum.Info]: StreamEnum.Stdout,
    [SeverityEnum.Success]: StreamEnum.Stdout,
    [SeverityEnum.Notice]: StreamEnum.Stdout,
    [SeverityEnum.Warning]: StreamEnum.Stderr,
    [SeverityEnum.Error]: StreamEnum.Stderr,
    [SeverityEnum.Critical]: StreamEnum.Stderr,
  };
  const streams = {...baseStreams, ...(overrides.streams ?? {})};

  return new ConsoleLogger(
    overrides.numberOfStackedLogs ?? 0,
    overrides.threshold ?? SeverityEnum.Debug,
    3, 3, 3, 3, 3, 3, 3,
    true,
    OutputModeEnum.Json,
    50,
    streams[SeverityEnum.Debug],
    streams[SeverityEnum.Info],
    streams[SeverityEnum.Success],
    streams[SeverityEnum.Notice],
    streams[SeverityEnum.Warning],
    streams[SeverityEnum.Error],
    streams[SeverityEnum.Critical],
  );
}

function buildLog(severity: SeverityEnum, message: string): LogModel {
  const log = new LogModel(severity, message);
  log.extra = {extra: "extra 1"};
  return log;
}

describe("ConsoleLogger stream routing", () => {
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it("routes default debug/info/success/notice to stdout and warning+/error+ to stderr", async () => {
    const logger = buildLogger();
    const logs = [
      buildLog(SeverityEnum.Debug, "d"),
      buildLog(SeverityEnum.Info, "i"),
      buildLog(SeverityEnum.Success, "s"),
      buildLog(SeverityEnum.Notice, "n"),
      buildLog(SeverityEnum.Warning, "w"),
      buildLog(SeverityEnum.Error, "e"),
      buildLog(SeverityEnum.Critical, "c"),
    ];
    for (const log of logs) {
      logger.readableStream!.push(log);
    }
    await new Promise(res => setTimeout(res, 200));

    for (const log of logs.slice(0, 4)) {
      expect(stdoutSpy).toHaveBeenCalledWith(Utils.outputLog(log, OutputModeEnum.Json, 10) + "\n");
    }
    for (const log of logs.slice(4)) {
      expect(stderrSpy).toHaveBeenCalledWith(Utils.outputLog(log, OutputModeEnum.Json, 10) + "\n");
    }
  });

  it("honors per-severity stream overrides", async () => {
    const logger = buildLogger({streams: {[SeverityEnum.Warning]: StreamEnum.Stdout}});
    const warning = buildLog(SeverityEnum.Warning, "moved");
    logger.readableStream!.push(warning);
    await new Promise(res => setTimeout(res, 200));

    expect(stdoutSpy).toHaveBeenCalledWith(Utils.outputLog(warning, OutputModeEnum.Json, 10) + "\n");
    expect(stderrSpy).not.toHaveBeenCalledWith(Utils.outputLog(warning, OutputModeEnum.Json, 10) + "\n");
  });

  it("filters logs below the configured severity threshold", async () => {
    const logger = buildLogger({threshold: SeverityEnum.Warning});
    const info = buildLog(SeverityEnum.Info, "below");
    const warning = buildLog(SeverityEnum.Warning, "above");
    logger.readableStream!.push(info);
    logger.readableStream!.push(warning);
    await new Promise(res => setTimeout(res, 200));

    expect(stdoutSpy).not.toHaveBeenCalledWith(Utils.outputLog(info, OutputModeEnum.Json, 10) + "\n");
    expect(stderrSpy).toHaveBeenCalledWith(Utils.outputLog(warning, OutputModeEnum.Json, 10) + "\n");
  });

  it("flushes stacked low-severity logs when an Error-or-higher log arrives", async () => {
    const logger = buildLogger({threshold: SeverityEnum.Critical, numberOfStackedLogs: 5});
    const info = buildLog(SeverityEnum.Info, "ctx-info");
    const critical = buildLog(SeverityEnum.Critical, "boom");
    logger.readableStream!.push(info);
    logger.readableStream!.push(critical);
    await new Promise(res => setTimeout(res, 200));

    expect(stdoutSpy).toHaveBeenCalledWith(Utils.outputLog(info, OutputModeEnum.Json, 10) + "\n");
    expect(stderrSpy).toHaveBeenCalledWith(Utils.outputLog(critical, OutputModeEnum.Json, 10) + "\n");
  });
});
