import "reflect-metadata";
import {ExitCode} from "@pristine-ts/common";
import {MysqlMigrateCommand} from "./mysql-migrate.command";

describe("MysqlMigrateCommand", () => {
  const makeCliOutput = () => ({write: jest.fn(), writeLine: jest.fn(), writeTable: jest.fn()});
  const makeLog = () => ({debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn(), success: jest.fn()});

  it("calls migrationManager.apply with the default config keyname", async () => {
    const apply = jest.fn().mockResolvedValue({
      configUniqueKeyname: "__default__", dryRun: false,
      appliedMigrations: [], skippedAlreadyApplied: [], failedMigration: undefined,
    });
    const cmd = new MysqlMigrateCommand({apply} as any, makeCliOutput() as any, makeLog() as any);
    const exit = await cmd.run({} as any);
    expect(apply).toHaveBeenCalledWith("__default__", {dryRun: false, force: false});
    expect(exit).toBe(ExitCode.Success);
  });

  it("forwards --config, --dry-run and --force to the orchestrator", async () => {
    const apply = jest.fn().mockResolvedValue({
      configUniqueKeyname: "analytics_db", dryRun: true,
      appliedMigrations: [], skippedAlreadyApplied: [], failedMigration: undefined,
    });
    const cmd = new MysqlMigrateCommand({apply} as any, makeCliOutput() as any, makeLog() as any);
    await cmd.run({config: "analytics_db", "dry-run": true, force: true} as any);
    expect(apply).toHaveBeenCalledWith("analytics_db", {dryRun: true, force: true});
  });

  it("returns Error when a migration fails", async () => {
    const apply = jest.fn().mockResolvedValue({
      configUniqueKeyname: "__default__", dryRun: false,
      appliedMigrations: [{name: "01-init", executionTimeMs: 5}],
      skippedAlreadyApplied: [],
      failedMigration: {name: "02-add", executionTimeMs: 0, error: "boom"},
    });
    const cmd = new MysqlMigrateCommand({apply} as any, makeCliOutput() as any, makeLog() as any);
    const exit = await cmd.run({} as any);
    expect(exit).toBe(ExitCode.Error);
  });

  it("returns Error when the orchestrator throws", async () => {
    const apply = jest.fn().mockRejectedValue(new Error("drift"));
    const cmd = new MysqlMigrateCommand({apply} as any, makeCliOutput() as any, makeLog() as any);
    const exit = await cmd.run({} as any);
    expect(exit).toBe(ExitCode.Error);
  });
});
