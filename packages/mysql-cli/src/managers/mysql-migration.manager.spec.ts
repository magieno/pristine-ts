import "reflect-metadata";
import {MysqlMigrationManager} from "./mysql-migration.manager";
import {MysqlMigrationChecksumManager} from "./mysql-migration-checksum.manager";
import {MigrationStateEnum} from "../enums/migration-state.enum";
import {MigrationInvalidNameError} from "../errors/migration-invalid-name.error";
import {MigrationDuplicateNameError} from "../errors/migration-duplicate-name.error";
import {MigrationChecksumMismatchError} from "../errors/migration-checksum-mismatch.error";
import {MigrationOrphanedRecordError} from "../errors/migration-orphaned-record.error";

const makeLogHandler = () => ({debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn(), success: jest.fn()});

const makeMigration = (name: string, sql = `-- ${name}`, configUniqueKeynames?: string[]) => ({
  name,
  configUniqueKeynames,
  up: jest.fn().mockResolvedValue(sql),
});

const baseConfig = {
  uniqueKeyname: "__default__",
  host: "h", port: 3306, user: "u", password: "p",
  connectionLimit: 1, debug: false, database: "d",
};

const provider = (config = baseConfig) => ({
  supports: (k: string) => k === config.uniqueKeyname,
  getMysqlConfig: async () => config,
});

describe("MysqlMigrationManager", () => {
  const checksumManager = new MysqlMigrationChecksumManager();

  let recordManager: {ensureTable: jest.Mock; listApplied: jest.Mock; recordApplied: jest.Mock};
  let runner: {execute: jest.Mock};

  beforeEach(() => {
    recordManager = {
      ensureTable: jest.fn().mockResolvedValue(undefined),
      listApplied: jest.fn().mockResolvedValue([]),
      recordApplied: jest.fn().mockResolvedValue(undefined),
    };
    runner = {execute: jest.fn().mockResolvedValue(42)};
  });

  describe("selection / validation", () => {
    it("filters out migrations whose configUniqueKeynames does not include the target", async () => {
      const migrations = [
        makeMigration("01-init"),
        makeMigration("02-only-analytics", "...", ["analytics_db"]),
      ];
      const manager = new MysqlMigrationManager(
        migrations as any, [provider()] as any, recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );

      const plan = await manager.status("__default__");
      expect(plan.entries.map((e) => e.name)).toEqual(["01-init"]);
    });

    it("throws on an invalid migration name", async () => {
      const manager = new MysqlMigrationManager(
        [makeMigration("not_a_valid_name")] as any,
        [provider()] as any, recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );
      await expect(manager.status("__default__")).rejects.toBeInstanceOf(MigrationInvalidNameError);
    });

    it("throws on duplicate migration names for the same config", async () => {
      const manager = new MysqlMigrationManager(
        [makeMigration("01-init"), makeMigration("01-init")] as any,
        [provider()] as any, recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );
      await expect(manager.status("__default__")).rejects.toBeInstanceOf(MigrationDuplicateNameError);
    });
  });

  describe("status", () => {
    it("classifies Pending, Applied, Modified, Orphaned correctly and sorts by name", async () => {
      const migrations = [
        makeMigration("01-init", "INIT"),
        makeMigration("02-add-users", "ADD USERS"),
        makeMigration("03-add-orders", "ADD ORDERS"),
      ];
      const appliedChecksumOf = (sql: string) => checksumManager.compute(sql);
      recordManager.listApplied.mockResolvedValueOnce([
        // 01-init: matches => Applied
        {id: 1, filename: "01-init", checksum: appliedChecksumOf("INIT"), appliedAt: new Date(), executionTimeMs: 5},
        // 02-add-users: mismatched => Modified
        {id: 2, filename: "02-add-users", checksum: "0".repeat(64), appliedAt: new Date(), executionTimeMs: 5},
        // 00-legacy: not registered => Orphaned
        {id: 3, filename: "00-legacy", checksum: "x".repeat(64), appliedAt: new Date(), executionTimeMs: 5},
      ]);

      const manager = new MysqlMigrationManager(
        migrations as any, [provider()] as any, recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );
      const plan = await manager.status("__default__");

      expect(plan.entries.map((e) => `${e.name}:${e.state}`)).toEqual([
        `00-legacy:${MigrationStateEnum.Orphaned}`,
        `01-init:${MigrationStateEnum.Applied}`,
        `02-add-users:${MigrationStateEnum.Modified}`,
        `03-add-orders:${MigrationStateEnum.Pending}`,
      ]);
      expect(plan.hasPending()).toBe(true);
      expect(plan.hasDrift()).toBe(true);
    });

    it("uses the custom migrationsTableName when set on the config", async () => {
      const customConfig = {...baseConfig, migrationsTableName: "my_table"};
      const manager = new MysqlMigrationManager(
        [makeMigration("01-init")] as any, [provider(customConfig)] as any,
        recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );
      await manager.status("__default__");
      expect(recordManager.ensureTable).toHaveBeenCalledWith("__default__", "my_table");
      expect(recordManager.listApplied).toHaveBeenCalledWith("__default__", "my_table");
    });
  });

  describe("verify", () => {
    it("returns the plan when there is no drift", async () => {
      const manager = new MysqlMigrationManager(
        [makeMigration("01-init")] as any, [provider()] as any,
        recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );
      const plan = await manager.verify("__default__");
      expect(plan.hasDrift()).toBe(false);
    });

    it("throws MigrationChecksumMismatchError on Modified", async () => {
      recordManager.listApplied.mockResolvedValueOnce([
        {id: 1, filename: "01-init", checksum: "0".repeat(64), appliedAt: new Date(), executionTimeMs: 0},
      ]);
      const manager = new MysqlMigrationManager(
        [makeMigration("01-init", "INIT")] as any, [provider()] as any,
        recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );
      await expect(manager.verify("__default__")).rejects.toBeInstanceOf(MigrationChecksumMismatchError);
    });

    it("throws MigrationOrphanedRecordError on Orphaned", async () => {
      recordManager.listApplied.mockResolvedValueOnce([
        {id: 1, filename: "99-gone", checksum: "0".repeat(64), appliedAt: new Date(), executionTimeMs: 0},
      ]);
      const manager = new MysqlMigrationManager(
        [] as any, [provider()] as any,
        recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );
      await expect(manager.verify("__default__")).rejects.toBeInstanceOf(MigrationOrphanedRecordError);
    });
  });

  describe("apply", () => {
    it("applies pending migrations in order and records them", async () => {
      const m1 = makeMigration("01-init", "SQL_1");
      const m2 = makeMigration("02-add", "SQL_2");
      const manager = new MysqlMigrationManager(
        [m2, m1] as any, [provider()] as any,
        recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );

      const result = await manager.apply("__default__");

      expect(result.appliedMigrations.map((e) => e.name)).toEqual(["01-init", "02-add"]);
      expect(result.skippedAlreadyApplied).toEqual([]);
      expect(result.failedMigration).toBeUndefined();

      expect(runner.execute).toHaveBeenCalledTimes(2);
      expect(runner.execute.mock.calls[0]).toEqual(["__default__", "01-init", "SQL_1"]);
      expect(runner.execute.mock.calls[1]).toEqual(["__default__", "02-add", "SQL_2"]);

      expect(recordManager.recordApplied).toHaveBeenCalledTimes(2);
      const [, , firstRecord] = recordManager.recordApplied.mock.calls[0];
      expect(firstRecord.filename).toBe("01-init");
      expect(firstRecord.checksum).toBe(checksumManager.compute("SQL_1"));
    });

    it("dry-run skips runner and recordApplied but still reports the plan", async () => {
      const m1 = makeMigration("01-init", "SQL_1");
      const manager = new MysqlMigrationManager(
        [m1] as any, [provider()] as any,
        recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );

      const result = await manager.apply("__default__", {dryRun: true});
      expect(result.dryRun).toBe(true);
      expect(result.appliedMigrations.map((e) => e.name)).toEqual(["01-init"]);
      expect(runner.execute).not.toHaveBeenCalled();
      expect(recordManager.recordApplied).not.toHaveBeenCalled();
    });

    it("halts on first execution failure and records it in failedMigration", async () => {
      const m1 = makeMigration("01-init", "SQL_1");
      const m2 = makeMigration("02-add", "SQL_2");
      runner.execute.mockResolvedValueOnce(5);
      runner.execute.mockRejectedValueOnce(new Error("syntax error near 'FOO'"));

      const manager = new MysqlMigrationManager(
        [m1, m2] as any, [provider()] as any,
        recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );

      const result = await manager.apply("__default__");
      expect(result.appliedMigrations.map((e) => e.name)).toEqual(["01-init"]);
      expect(result.failedMigration?.name).toBe("02-add");
      expect(result.failedMigration?.error).toMatch(/syntax error/);
    });

    it("refuses to proceed on drift unless --force", async () => {
      recordManager.listApplied.mockResolvedValue([
        {id: 1, filename: "01-init", checksum: "0".repeat(64), appliedAt: new Date(), executionTimeMs: 0},
      ]);
      const manager = new MysqlMigrationManager(
        [makeMigration("01-init", "DIFFERENT")] as any, [provider()] as any,
        recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );

      await expect(manager.apply("__default__")).rejects.toBeInstanceOf(MigrationChecksumMismatchError);

      // With --force, no throw, but Modified is not re-applied.
      const result = await manager.apply("__default__", {force: true});
      expect(result.appliedMigrations).toEqual([]);
      expect(runner.execute).not.toHaveBeenCalled();
    });

    it("reports skippedAlreadyApplied for entries already in the database", async () => {
      const m1 = makeMigration("01-init", "SQL_1");
      const m2 = makeMigration("02-add", "SQL_2");
      recordManager.listApplied.mockResolvedValueOnce([
        {id: 1, filename: "01-init", checksum: checksumManager.compute("SQL_1"), appliedAt: new Date(), executionTimeMs: 0},
      ]);

      const manager = new MysqlMigrationManager(
        [m1, m2] as any, [provider()] as any,
        recordManager as any, runner as any, checksumManager, makeLogHandler() as any,
      );

      const result = await manager.apply("__default__");
      expect(result.skippedAlreadyApplied).toEqual(["01-init"]);
      expect(result.appliedMigrations.map((e) => e.name)).toEqual(["02-add"]);
    });
  });
});
