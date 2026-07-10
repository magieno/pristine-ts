import "reflect-metadata";
import {DefaultSqliteConfigProvider} from "./default-sqlite.config-provider";
import {SqliteConfig} from "../configs/sqlite.config";

describe('Default SQLite Config Provider', () => {
  const sqliteConfigs: SqliteConfig[] = [
    {
      uniqueKeyname: "__default__",
      filename: "",
    },
    {
      uniqueKeyname: "app",
      filename: "/tmp/app.db",
    },
  ];

  it("should support a registered unique keyname", () => {
    const provider = new DefaultSqliteConfigProvider(sqliteConfigs);

    expect(provider.supports("app")).toBeTruthy();
    expect(provider.supports("unknown")).toBeFalsy();
  })

  it("should return the sqlite config for a registered unique keyname", async () => {
    const provider = new DefaultSqliteConfigProvider(sqliteConfigs);

    const config = await provider.getSqliteConfig("app");

    expect(config.filename).toBe("/tmp/app.db");
  })

  it("should throw for an unknown unique keyname", async () => {
    const provider = new DefaultSqliteConfigProvider(sqliteConfigs);

    await expect(provider.getSqliteConfig("unknown")).rejects.toThrow("The sqlite config with the unique keyname unknown does not exist.");
  })
});
