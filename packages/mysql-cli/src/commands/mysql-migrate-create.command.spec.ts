import "reflect-metadata";
import {ExitCode} from "@pristine-ts/common";
import {MysqlMigrateCreateCommand} from "./mysql-migrate-create.command";
import {MysqlMigrateCreateCommandOptions} from "./mysql-migrate-create.command-options";

const makeArgs = (overrides: Partial<MysqlMigrateCreateCommandOptions>): MysqlMigrateCreateCommandOptions =>
  Object.assign(new MysqlMigrateCreateCommandOptions(), overrides);

describe("MysqlMigrateCreateCommand", () => {
  const makeCliOutput = () => ({write: jest.fn(), writeLine: jest.fn(), writeTable: jest.fn()});
  const makeLog = () => ({debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn(), success: jest.fn()});

  it("delegates to the scaffold manager with descriptiveName from --name", async () => {
    const scaffoldCreate = jest.fn().mockResolvedValue({
      filePath: "/tmp/01-init.sql-migrations.ts", className: "Init_01", migrationName: "01-init", barrelUpdated: false,
    });

    const cmd = new MysqlMigrateCreateCommand("src/sql-migrations", "",
      {create: scaffoldCreate} as any, makeCliOutput() as any, makeLog() as any);

    expect(await cmd.run(makeArgs({name: "init"}))).toBe(ExitCode.Success);
    expect(scaffoldCreate).toHaveBeenCalledWith(expect.objectContaining({descriptiveName: "init"}));
  });

  it("falls back to positional from `_` when --name not given", async () => {
    const scaffoldCreate = jest.fn().mockResolvedValue({
      filePath: "/tmp/02-add.sql-migrations.ts", className: "Add_02", migrationName: "02-add", barrelUpdated: false,
    });

    const cmd = new MysqlMigrateCreateCommand("src/sql-migrations", "",
      {create: scaffoldCreate} as any, makeCliOutput() as any, makeLog() as any);

    expect(await cmd.run(makeArgs({_: ["add"]}))).toBe(ExitCode.Success);
    expect(scaffoldCreate).toHaveBeenCalledWith(expect.objectContaining({descriptiveName: "add"}));
  });

  it("returns Error when no descriptive name is supplied", async () => {
    const scaffoldCreate = jest.fn();
    const cmd = new MysqlMigrateCreateCommand("src/sql-migrations", "",
      {create: scaffoldCreate} as any, makeCliOutput() as any, makeLog() as any);
    expect(await cmd.run(makeArgs({}))).toBe(ExitCode.Error);
    expect(scaffoldCreate).not.toHaveBeenCalled();
  });

  it("passes configUniqueKeynames when --config is given", async () => {
    const scaffoldCreate = jest.fn().mockResolvedValue({
      filePath: "/tmp/03-x.sql-migrations.ts", className: "X_03", migrationName: "03-x", barrelUpdated: false,
    });
    const cmd = new MysqlMigrateCreateCommand("src/sql-migrations", "",
      {create: scaffoldCreate} as any, makeCliOutput() as any, makeLog() as any);

    await cmd.run(makeArgs({name: "x", config: "analytics_db"}));
    expect(scaffoldCreate).toHaveBeenCalledWith(expect.objectContaining({configUniqueKeynames: ["analytics_db"]}));
  });

  it("returns Error when the scaffold manager throws", async () => {
    const scaffoldCreate = jest.fn().mockRejectedValue(new Error("collision"));
    const cmd = new MysqlMigrateCreateCommand("src/sql-migrations", "",
      {create: scaffoldCreate} as any, makeCliOutput() as any, makeLog() as any);
    expect(await cmd.run(makeArgs({name: "init"}))).toBe(ExitCode.Error);
  });
});
