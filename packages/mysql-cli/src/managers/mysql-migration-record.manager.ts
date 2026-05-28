import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {MysqlClientInterface} from "@pristine-ts/mysql";
import {MigrationRecord} from "../models/migration-record.model";

/**
 * Owns the `pristine_migrations` bookkeeping table — creates it on demand, reads
 * the applied rows back, and inserts a new row when a migration finishes.
 *
 * Uses the regular `MysqlClient` pool (no `multipleStatements` needed for any of
 * these queries — they're single statements with parameter placeholders).
 */
@injectable()
export class MysqlMigrationRecordManager {
  constructor(
    @inject("MysqlClientInterface") private readonly mysqlClient: MysqlClientInterface,
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
  }

  public async ensureTable(configUniqueKeyname: string, tableName: string): Promise<void> {
    const sql = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
      filename          VARCHAR(255) NOT NULL,
      checksum          CHAR(64)     NOT NULL,
      applied_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      execution_time_ms INT UNSIGNED NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_filename (filename)
    )`;

    await this.mysqlClient.executeSql(configUniqueKeyname, sql, []);

    this.logHandler.debug("MysqlMigrationRecordManager: ensured bookkeeping table.", {
      highlights: {tableName, configUniqueKeyname},
    });
  }

  public async listApplied(configUniqueKeyname: string, tableName: string): Promise<MigrationRecord[]> {
    const sql = `SELECT id, filename, checksum, applied_at, execution_time_ms
                 FROM \`${tableName}\`
                 ORDER BY filename ASC`;

    const rows: Array<{
      id: number;
      filename: string;
      checksum: string;
      applied_at: Date | string;
      execution_time_ms: number | null;
    }> = await this.mysqlClient.executeSql(configUniqueKeyname, sql, []);

    return rows.map((row) => {
      const record = new MigrationRecord();
      record.id = row.id;
      record.filename = row.filename;
      record.checksum = row.checksum;
      record.appliedAt = row.applied_at instanceof Date ? row.applied_at : new Date(row.applied_at);
      record.executionTimeMs = row.execution_time_ms ?? undefined;
      return record;
    });
  }

  public async recordApplied(
    configUniqueKeyname: string,
    tableName: string,
    record: { filename: string; checksum: string; executionTimeMs: number },
  ): Promise<void> {
    const sql = `INSERT INTO \`${tableName}\` (filename, checksum, execution_time_ms)
                 VALUES (?, ?, ?)`;

    await this.mysqlClient.executeSql(configUniqueKeyname, sql, [
      record.filename,
      record.checksum,
      record.executionTimeMs,
    ]);

    this.logHandler.debug("MysqlMigrationRecordManager: recorded applied migration.", {
      highlights: {tableName, configUniqueKeyname, filename: record.filename},
    });
  }
}
