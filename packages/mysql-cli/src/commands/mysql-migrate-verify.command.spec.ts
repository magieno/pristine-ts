import "reflect-metadata";
import {ExitCode} from "@pristine-ts/common";
import {MysqlMigrateVerifyCommand} from "./mysql-migrate-verify.command";

describe("MysqlMigrateVerifyCommand", () => {
  const makeCliOutput = () => ({write: jest.fn(), writeLine: jest.fn(), writeTable: jest.fn()});
  const makeLog = () => ({debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn(), success: jest.fn()});

  it("returns Success when verify resolves", async () => {
    const verify = jest.fn().mockResolvedValue({hasDrift: () => false});
    const cmd = new MysqlMigrateVerifyCommand({verify} as any, makeCliOutput() as any, makeLog() as any);
    expect(await cmd.run({} as any)).toBe(ExitCode.Success);
  });

  it("returns Error when verify throws", async () => {
    const verify = jest.fn().mockRejectedValue(new Error("drift"));
    const cmd = new MysqlMigrateVerifyCommand({verify} as any, makeCliOutput() as any, makeLog() as any);
    expect(await cmd.run({} as any)).toBe(ExitCode.Error);
  });
});
