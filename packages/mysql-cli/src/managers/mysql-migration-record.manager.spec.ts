import "reflect-metadata";
import {MysqlMigrationRecordManager} from "./mysql-migration-record.manager";

describe("MysqlMigrationRecordManager", () => {
  let executeSql: jest.Mock;
  let logHandler: { debug: jest.Mock; info: jest.Mock; warning: jest.Mock; error: jest.Mock };
  let manager: MysqlMigrationRecordManager;

  beforeEach(() => {
    executeSql = jest.fn().mockResolvedValue([]);
    logHandler = {debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn()};
    manager = new MysqlMigrationRecordManager({executeSql} as any, logHandler as any);
  });

  describe("ensureTable", () => {
    it("issues a CREATE TABLE IF NOT EXISTS against the configured table name", async () => {
      await manager.ensureTable("__default__", "pristine_migrations");
      expect(executeSql).toHaveBeenCalledTimes(1);
      const [configUniqueKeyname, sql, values] = executeSql.mock.calls[0];
      expect(configUniqueKeyname).toBe("__default__");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS `pristine_migrations`");
      expect(sql).toContain("UNIQUE KEY uniq_filename");
      expect(values).toEqual([]);
    });

    it("honors a custom table name", async () => {
      await manager.ensureTable("__default__", "my_custom_migrations");
      expect(executeSql.mock.calls[0][1]).toContain("`my_custom_migrations`");
    });
  });

  describe("listApplied", () => {
    it("returns rows mapped into MigrationRecord instances, sorted by filename", async () => {
      const appliedAt = new Date("2026-05-28T12:00:00.000Z");
      executeSql.mockResolvedValueOnce([
        {id: 1, filename: "01-init", checksum: "a".repeat(64), applied_at: appliedAt, execution_time_ms: 42},
        {id: 2, filename: "02-add-users", checksum: "b".repeat(64), applied_at: appliedAt, execution_time_ms: null},
      ]);

      const records = await manager.listApplied("__default__", "pristine_migrations");

      expect(executeSql.mock.calls[0][1]).toContain("ORDER BY filename ASC");
      expect(records).toHaveLength(2);
      expect(records[0].filename).toBe("01-init");
      expect(records[0].executionTimeMs).toBe(42);
      expect(records[1].executionTimeMs).toBeUndefined();
      expect(records[1].appliedAt).toEqual(appliedAt);
    });

    it("converts string-format applied_at values into Date instances", async () => {
      executeSql.mockResolvedValueOnce([
        {id: 1, filename: "01-init", checksum: "x".repeat(64), applied_at: "2026-05-28 12:00:00.000", execution_time_ms: 10},
      ]);

      const records = await manager.listApplied("__default__", "pristine_migrations");
      expect(records[0].appliedAt).toBeInstanceOf(Date);
    });
  });

  describe("recordApplied", () => {
    it("inserts a row with the right values", async () => {
      await manager.recordApplied("__default__", "pristine_migrations", {
        filename: "03-add-orders",
        checksum: "c".repeat(64),
        executionTimeMs: 17,
      });

      const [, sql, values] = executeSql.mock.calls[0];
      expect(sql).toContain("INSERT INTO `pristine_migrations`");
      expect(sql).toContain("(filename, checksum, execution_time_ms)");
      expect(values).toEqual(["03-add-orders", "c".repeat(64), 17]);
    });
  });
});
