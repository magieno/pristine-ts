/**
 * Thrown by `verify` (and by `apply` without `--force`) when the bookkeeping table
 * holds a record for a migration that no longer exists in the registered DI graph.
 * Indicates a deleted migration class, a renamed `name` field, or running against
 * the wrong config. The fix is to restore the class, fix the name, or run against
 * the correct config.
 */
export class MigrationOrphanedRecordError extends Error {
  public constructor(
    public readonly migrationName: string,
    public readonly configUniqueKeyname: string,
  ) {
    super(
      `Database has a record for migration "${migrationName}" against config ` +
      `"${configUniqueKeyname}" but no matching class is registered. Restore the ` +
      `class, check the \`name\` field, or target a different config.`,
    );

    Object.setPrototypeOf(this, MigrationOrphanedRecordError.prototype);
  }
}
