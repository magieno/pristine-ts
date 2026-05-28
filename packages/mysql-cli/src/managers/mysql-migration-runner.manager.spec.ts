import "reflect-metadata";

const createConnectionMock = jest.fn();

jest.mock("mysql2/promise", () => ({
  createConnection: (...args: unknown[]) => createConnectionMock(...args),
}));

import {MysqlMigrationRunner} from "./mysql-migration-runner.manager";
import {MigrationExecutionError} from "../errors/migration-execution.error";

describe("MysqlMigrationRunner", () => {
  const config = {
    uniqueKeyname: "__default__",
    host: "localhost",
    port: 3306,
    user: "root",
    password: "secret",
    connectionLimit: 1,
    debug: false,
    database: "test",
  };

  const provider = {
    supports: (k: string) => k === "__default__",
    getMysqlConfig: async () => config,
  };

  const logHandler = {debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn()};

  let query: jest.Mock;
  let end: jest.Mock;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue([]);
    end = jest.fn().mockResolvedValue(undefined);
    createConnectionMock.mockReset();
    createConnectionMock.mockResolvedValue({query, end});
    Object.values(logHandler).forEach((fn) => (fn as jest.Mock).mockReset());
  });

  it("opens a connection with multipleStatements:true and closes it", async () => {
    const runner = new MysqlMigrationRunner([provider] as any, logHandler as any);

    await runner.execute("__default__", "01-init", "CREATE TABLE users (id INT);");

    expect(createConnectionMock).toHaveBeenCalledTimes(1);
    expect(createConnectionMock.mock.calls[0][0]).toMatchObject({
      host: "localhost", port: 3306, user: "root", password: "secret", database: "test",
      multipleStatements: true,
    });
    expect(query).toHaveBeenCalledWith("CREATE TABLE users (id INT);");
    expect(end).toHaveBeenCalledTimes(1);
  });

  it("returns the elapsed ms", async () => {
    const runner = new MysqlMigrationRunner([provider] as any, logHandler as any);
    const elapsed = await runner.execute("__default__", "01-init", "SELECT 1;");
    expect(typeof elapsed).toBe("number");
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it("wraps query errors in MigrationExecutionError and still closes the connection", async () => {
    query.mockRejectedValueOnce(new Error("duplicate column"));
    const runner = new MysqlMigrationRunner([provider] as any, logHandler as any);

    await expect(runner.execute("__default__", "02-add-col", "ALTER TABLE x ADD y INT;"))
      .rejects.toBeInstanceOf(MigrationExecutionError);
    expect(end).toHaveBeenCalledTimes(1);
  });

  it("throws when no provider supports the config keyname", async () => {
    const runner = new MysqlMigrationRunner([provider] as any, logHandler as any);
    await expect(runner.execute("missing", "01-init", "SELECT 1;"))
      .rejects.toThrow(/No MysqlConfigProvider supports/);
  });

  it("does not propagate connection.end() failures", async () => {
    end.mockRejectedValueOnce(new Error("socket hang up"));
    const runner = new MysqlMigrationRunner([provider] as any, logHandler as any);
    await expect(runner.execute("__default__", "01-init", "SELECT 1;")).resolves.toBeDefined();
    expect(logHandler.warning).toHaveBeenCalled();
  });
});
