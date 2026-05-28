/**
 * Thrown by `verify` (and by `apply` without `--force`) when a migration that's
 * already applied has had its `up()` body edited since. Indicates someone changed
 * a migration after it ran somewhere — the new SQL was never applied to that
 * database. The fix is either to revert the change or to write a new migration
 * that produces the desired state.
 */
export class MigrationChecksumMismatchError extends Error {
  public constructor(
    public readonly migrationName: string,
    public readonly configUniqueKeyname: string,
    public readonly diskChecksum: string,
    public readonly appliedChecksum: string,
  ) {
    super(
      `Migration "${migrationName}" has been edited since it was applied to config ` +
      `"${configUniqueKeyname}". Disk checksum ${diskChecksum} vs applied ` +
      `${appliedChecksum}. Revert the edit or add a new migration to roll forward.`,
    );

    Object.setPrototypeOf(this, MigrationChecksumMismatchError.prototype);
  }
}
