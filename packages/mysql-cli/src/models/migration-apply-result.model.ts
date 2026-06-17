import {MigrationApplyEntry} from "./migration-apply-entry.model";

/**
 * Output of `MysqlMigrationManager.apply`. `appliedMigrations` is the in-order list
 * of migrations that ran successfully. `skippedAlreadyApplied` is the list of
 * names that were already in the database (no-op). `failedMigration` is set when
 * the run halted on a failure — subsequent pending migrations were not attempted.
 */
export class MigrationApplyResult {
  public configUniqueKeyname!: string;
  public dryRun: boolean = false;
  public appliedMigrations: MigrationApplyEntry[] = [];
  public skippedAlreadyApplied: string[] = [];
  public failedMigration?: MigrationApplyEntry;
}
