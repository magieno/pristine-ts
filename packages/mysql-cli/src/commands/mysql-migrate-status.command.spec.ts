import "reflect-metadata";
import {ExitCode} from "@pristine-ts/common";
import {MysqlMigrateStatusCommand} from "./mysql-migrate-status.command";
import {MigrationStateEnum} from "../enums/migration-state.enum";

describe("MysqlMigrateStatusCommand", () => {
  const makeCliOutput = () => ({write: jest.fn(), writeLine: jest.fn(), writeTable: jest.fn()});
  const makeLog = () => ({debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn(), success: jest.fn()});

  it("returns Success and prints each entry", async () => {
    const cliOutput = makeCliOutput();
    const status = jest.fn().mockResolvedValue({
      configUniqueKeyname: "__default__",
      tableName: "pristine_migrations",
      entries: [
        {name: "01-init", state: MigrationStateEnum.Applied, appliedAt: new Date("2026-01-01T00:00:00Z")},
        {name: "02-add", state: MigrationStateEnum.Pending},
      ],
      hasPending: () => true, hasDrift: () => false,
      countByState: (state: MigrationStateEnum) => state === MigrationStateEnum.Pending ? 1 : state === MigrationStateEnum.Applied ? 1 : 0,
    });

    const cmd = new MysqlMigrateStatusCommand({status} as any, cliOutput as any, makeLog() as any);
    const exit = await cmd.run({} as any);
    expect(exit).toBe(ExitCode.Success);
    const lines = cliOutput.writeLine.mock.calls.map(([line]) => line);
    expect(lines.some((line) => line.includes("01-init") && line.includes("Applied"))).toBe(true);
    expect(lines.some((line) => line.includes("02-add") && line.includes("Pending"))).toBe(true);
  });

  it("returns Error when status throws", async () => {
    const status = jest.fn().mockRejectedValue(new Error("nope"));
    const cmd = new MysqlMigrateStatusCommand({status} as any, makeCliOutput() as any, makeLog() as any);
    expect(await cmd.run({} as any)).toBe(ExitCode.Error);
  });
});
