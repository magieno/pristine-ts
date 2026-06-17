import {inject, injectable, injectAll} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {traced} from "@pristine-ts/common";
import {MysqlConfig, MysqlConfigProviderInterface} from "@pristine-ts/mysql";
import {MysqlMigrationInterface} from "../interfaces/mysql-migration.interface";
import {MigrationStateEnum} from "../enums/migration-state.enum";
import {MigrationPlan} from "../models/migration-plan.model";
import {MigrationPlanEntry} from "../models/migration-plan-entry.model";
import {MigrationApplyResult} from "../models/migration-apply-result.model";
import {MigrationApplyEntry} from "../models/migration-apply-entry.model";
import {MigrationRecord} from "../models/migration-record.model";
import {MysqlMigrationChecksumManager} from "./mysql-migration-checksum.manager";
import {MysqlMigrationRecordManager} from "./mysql-migration-record.manager";
import {MysqlMigrationRunner} from "./mysql-migration-runner.manager";
import {MigrationInvalidNameError} from "../errors/migration-invalid-name.error";
import {MigrationDuplicateNameError} from "../errors/migration-duplicate-name.error";
import {MigrationChecksumMismatchError} from "../errors/migration-checksum-mismatch.error";
import {MigrationOrphanedRecordError} from "../errors/migration-orphaned-record.error";
import {MigrationExecutionError} from "../errors/migration-execution.error";

/**
 * Public orchestrator for migration operations. The CLI commands and any deploy-time
 * runner should depend on this class — never on `MysqlMigrationRunner` /
 * `MysqlMigrationRecordManager` directly.
 *
 * Discovery is DI-based: every migration registered with
 * `@tag("MysqlMigrationInterface") @injectable()` and reachable through the AppModule's
 * `importServices` graph is injected here via `@injectAll`. There is no filesystem
 * scan at apply time, which means this works identically in a bundled Lambda and on
 * a dev laptop.
 */
@injectable()
export class MysqlMigrationManager {
  private static readonly DefaultTableName = "pristine_migrations";
  private static readonly ValidNamePattern = /^\d+-[a-z0-9-]+$/;

  constructor(
    @injectAll("MysqlMigrationInterface") private readonly registeredMigrations: MysqlMigrationInterface[],
    @injectAll("MysqlConfigProviderInterface") private readonly mysqlConfigProviders: MysqlConfigProviderInterface[],
    private readonly recordManager: MysqlMigrationRecordManager,
    private readonly runner: MysqlMigrationRunner,
    private readonly checksumManager: MysqlMigrationChecksumManager,
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
  }

  @traced()
  public async status(configUniqueKeyname: string): Promise<MigrationPlan> {
    const tableName = await this.resolveTableName(configUniqueKeyname);
    await this.recordManager.ensureTable(configUniqueKeyname, tableName);
    return this.buildPlan(configUniqueKeyname, tableName);
  }

  @traced()
  public async verify(configUniqueKeyname: string): Promise<MigrationPlan> {
    const plan = await this.status(configUniqueKeyname);
    this.assertNoDrift(plan, configUniqueKeyname);
    return plan;
  }

  @traced()
  public async apply(configUniqueKeyname: string, options?: { dryRun?: boolean; force?: boolean }): Promise<MigrationApplyResult> {
    const dryRun = options?.dryRun === true;
    const force = options?.force === true;

    const tableName = await this.resolveTableName(configUniqueKeyname);
    await this.recordManager.ensureTable(configUniqueKeyname, tableName);

    const plan = await this.buildPlan(configUniqueKeyname, tableName);

    const result = new MigrationApplyResult();
    result.configUniqueKeyname = configUniqueKeyname;
    result.dryRun = dryRun;

    if (force === false) {
      this.assertNoDrift(plan, configUniqueKeyname);
    } else if (plan.hasDrift()) {
      this.logHandler.warning("MysqlMigrationManager: proceeding past drift due to --force.", {
        highlights: {
          configUniqueKeyname,
          modified: plan.countByState(MigrationStateEnum.Modified),
          orphaned: plan.countByState(MigrationStateEnum.Orphaned),
        },
      });
    }

    const migrationsByName = new Map(this.selectMigrations(configUniqueKeyname).map((m) => [m.name, m]));

    for (const entry of plan.entries) {
      if (entry.state === MigrationStateEnum.Applied) {
        result.skippedAlreadyApplied.push(entry.name);
        continue;
      }
      if (entry.state !== MigrationStateEnum.Pending) {
        // Modified or Orphaned — only reachable here under --force. Skip; the user is
        // explicitly accepting the drift, but we won't re-run modified migrations or
        // touch orphaned records.
        continue;
      }

      const migration = migrationsByName.get(entry.name);
      if (migration === undefined) {
        // Defensive: a Pending entry by definition came from registeredMigrations.
        continue;
      }

      const sql = await migration.up();
      const checksum = this.checksumManager.compute(sql);

      const applyEntry = new MigrationApplyEntry();
      applyEntry.name = entry.name;

      try {
        if (dryRun) {
          applyEntry.executionTimeMs = 0;
        } else {
          applyEntry.executionTimeMs = await this.runner.execute(configUniqueKeyname, entry.name, sql);
          await this.recordManager.recordApplied(configUniqueKeyname, tableName, {
            filename: entry.name,
            checksum,
            executionTimeMs: applyEntry.executionTimeMs,
          });
        }
        result.appliedMigrations.push(applyEntry);
      } catch (error) {
        applyEntry.executionTimeMs = 0;
        applyEntry.error = error instanceof MigrationExecutionError ? error.message : (error as Error).message;
        result.failedMigration = applyEntry;
        return result;
      }
    }

    return result;
  }

  private async resolveConfig(configUniqueKeyname: string): Promise<MysqlConfig> {
    const provider = this.mysqlConfigProviders.find((p) => p.supports(configUniqueKeyname));
    if (provider === undefined) {
      throw new Error(`No MysqlConfigProvider supports the unique keyname "${configUniqueKeyname}".`);
    }
    return provider.getMysqlConfig(configUniqueKeyname);
  }

  private async resolveTableName(configUniqueKeyname: string): Promise<string> {
    const config = await this.resolveConfig(configUniqueKeyname);
    return config.migrationsTableName ?? MysqlMigrationManager.DefaultTableName;
  }

  private selectMigrations(configUniqueKeyname: string): MysqlMigrationInterface[] {
    const filtered = this.registeredMigrations.filter((migration) => {
      if (migration.configUniqueKeynames === undefined) {
        return true;
      }
      return migration.configUniqueKeynames.includes(configUniqueKeyname);
    });

    const seen = new Set<string>();
    for (const migration of filtered) {
      if (MysqlMigrationManager.ValidNamePattern.test(migration.name) === false) {
        throw new MigrationInvalidNameError(migration.name);
      }
      if (seen.has(migration.name)) {
        throw new MigrationDuplicateNameError(migration.name, configUniqueKeyname);
      }
      seen.add(migration.name);
    }

    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }

  private async buildPlan(configUniqueKeyname: string, tableName: string): Promise<MigrationPlan> {
    const plan = new MigrationPlan();
    plan.configUniqueKeyname = configUniqueKeyname;
    plan.tableName = tableName;

    const selected = this.selectMigrations(configUniqueKeyname);
    const records = await this.recordManager.listApplied(configUniqueKeyname, tableName);
    const recordsByName = new Map<string, MigrationRecord>(records.map((r) => [r.filename, r]));

    const seenNames = new Set<string>();

    for (const migration of selected) {
      const sql = await migration.up();
      const diskChecksum = this.checksumManager.compute(sql);
      const record = recordsByName.get(migration.name);

      const entry = new MigrationPlanEntry();
      entry.name = migration.name;
      entry.diskChecksum = diskChecksum;

      if (record === undefined) {
        entry.state = MigrationStateEnum.Pending;
      } else {
        entry.appliedChecksum = record.checksum;
        entry.appliedAt = record.appliedAt;
        entry.state = record.checksum === diskChecksum ? MigrationStateEnum.Applied : MigrationStateEnum.Modified;
      }

      plan.entries.push(entry);
      seenNames.add(migration.name);
    }

    for (const record of records) {
      if (seenNames.has(record.filename)) {
        continue;
      }
      const entry = new MigrationPlanEntry();
      entry.name = record.filename;
      entry.state = MigrationStateEnum.Orphaned;
      entry.appliedChecksum = record.checksum;
      entry.appliedAt = record.appliedAt;
      plan.entries.push(entry);
    }

    plan.entries.sort((a, b) => a.name.localeCompare(b.name));
    return plan;
  }

  private assertNoDrift(plan: MigrationPlan, configUniqueKeyname: string): void {
    for (const entry of plan.entries) {
      if (entry.state === MigrationStateEnum.Modified) {
        throw new MigrationChecksumMismatchError(
          entry.name,
          configUniqueKeyname,
          entry.diskChecksum ?? "",
          entry.appliedChecksum ?? "",
        );
      }
      if (entry.state === MigrationStateEnum.Orphaned) {
        throw new MigrationOrphanedRecordError(entry.name, configUniqueKeyname);
      }
    }
  }
}
