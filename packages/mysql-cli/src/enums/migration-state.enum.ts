/**
 * State of a single migration as observed by `MysqlMigrationManager.status` /
 * `verify`. Computed from the union of registered migrations (DI) and applied
 * records (the `pristine_migrations` table).
 */
export enum MigrationStateEnum {
  /** Registered in DI, not in the database. Will be applied next `migrate` run. */
  Pending = "pending",

  /** Registered in DI, in the database, checksums match. Nothing to do. */
  Applied = "applied",

  /**
   * Registered in DI, in the database, checksums differ. The migration's `up()` was
   * edited after it was applied. Verify fails; apply refuses to proceed (unless
   * `--force`).
   */
  Modified = "modified",

  /**
   * In the database, not registered in DI. The class was deleted from the codebase,
   * or the CLI is targeting the wrong config. Verify fails; apply refuses to proceed
   * (unless `--force`).
   */
  Orphaned = "orphaned",
}
