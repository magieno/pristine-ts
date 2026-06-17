/**
 * Thrown when mysql2 raises an error while executing a migration's SQL. Carries the
 * failing migration name and wraps the underlying error for context. The `apply`
 * orchestrator catches this, halts further migrations, and reports it as the
 * `failedMigration` entry on the result.
 */
export class MigrationExecutionError extends Error {
  public constructor(
    public readonly migrationName: string,
    public readonly configUniqueKeyname: string,
    public readonly cause: Error,
  ) {
    super(
      `Migration "${migrationName}" failed against config "${configUniqueKeyname}": ` +
      `${cause.message}`,
    );

    Object.setPrototypeOf(this, MigrationExecutionError.prototype);
  }
}
