import "reflect-metadata";
import {PrettyLogFormatter} from "./pretty-log-formatter";
import {LogModel} from "../models/log.model";
import {SeverityEnum} from "../enums/severity.enum";

describe("PrettyLogFormatter", () => {
  const makeLog = (severity: SeverityEnum, message: string): LogModel => {
    const log = new LogModel(severity, message);
    log.date = new Date("2021-01-02T03:04:05.678Z");
    return log;
  };

  it("renders each severity with its icon and severity label", () => {
    const cases: Array<{severity: SeverityEnum; label: string; icon: string}> = [
      {severity: SeverityEnum.Debug, label: "DEBUG", icon: "·"},
      {severity: SeverityEnum.Info, label: "INFO", icon: "ℹ"},
      {severity: SeverityEnum.Success, label: "SUCCESS", icon: "✔"},
      {severity: SeverityEnum.Notice, label: "NOTICE", icon: "ℹ"},
      {severity: SeverityEnum.Warning, label: "WARNING", icon: "⚠"},
      {severity: SeverityEnum.Error, label: "ERROR", icon: "✖"},
      {severity: SeverityEnum.Critical, label: "CRITICAL", icon: "✖"},
    ];

    for (const c of cases) {
      const out = PrettyLogFormatter.format(makeLog(c.severity, "hello"));
      expect(out).toContain(`[${c.label}]`);
      expect(out).toContain(c.icon);
      expect(out).toContain("hello");
      expect(out).toMatch(/\x1b\[\d/); // includes at least one ANSI escape
    }
  });

  it("renders the Success severity with the green color escape", () => {
    const out = PrettyLogFormatter.format(makeLog(SeverityEnum.Success, "done"));
    expect(out).toContain("\x1b[32m"); // green foreground
    expect(out).toContain("✔");
  });

  it("includes the timestamp in yyyy-MM-dd HH:mm:ss.SSS format", () => {
    const out = PrettyLogFormatter.format(makeLog(SeverityEnum.Info, "msg"));
    expect(out).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/);
  });

  it("renders highlights indented under the message", () => {
    const log = makeLog(SeverityEnum.Info, "compiled");
    log.highlights = {tsconfig: "tsconfig.json", filesEmitted: 12};
    const out = PrettyLogFormatter.format(log);
    expect(out).toContain('\n\t- tsconfig: "tsconfig.json"');
    expect(out).toContain('\n\t- filesEmitted: 12');
  });

  it("omits `extra` from the rendered output", () => {
    const log = makeLog(SeverityEnum.Info, "msg");
    log.extra = {secret: "should-not-appear"};
    const out = PrettyLogFormatter.format(log);
    expect(out).not.toContain("should-not-appear");
    expect(out).not.toContain("secret");
  });

  it("renders messages with no highlights as a single line plus reset", () => {
    const out = PrettyLogFormatter.format(makeLog(SeverityEnum.Info, "msg"));
    expect(out).not.toContain("\n\t- ");
  });
});
