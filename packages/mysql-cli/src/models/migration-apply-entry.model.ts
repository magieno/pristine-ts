/**
 * One row of a `MigrationApplyResult`: the outcome of applying a single migration.
 * `error` is populated only when the migration failed.
 */
export class MigrationApplyEntry {
  public name!: string;
  public executionTimeMs!: number;
  public error?: string;
}
