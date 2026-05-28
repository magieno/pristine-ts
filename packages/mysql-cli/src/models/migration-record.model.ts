/**
 * One row of the `pristine_migrations` bookkeeping table. Mirrors the schema exactly
 * (snake_case in the database; the manager handles translation when reading rows
 * back via `MysqlClient.executeSql`).
 */
export class MigrationRecord {
  public id!: number;
  public filename!: string;
  public checksum!: string;
  public appliedAt!: Date;
  public executionTimeMs?: number;
}
