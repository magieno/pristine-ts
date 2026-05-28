/**
 * Thrown when two registered migrations share the same `name` after filtering by
 * `configUniqueKeynames` for the targeted config. Names must be globally unique per
 * config because the database stores them in a `UNIQUE` column. The usual cause is
 * a copy-paste mistake at scaffold time.
 */
export class MigrationDuplicateNameError extends Error {
  public constructor(
    public readonly migrationName: string,
    public readonly configUniqueKeyname: string,
  ) {
    super(
      `Multiple registered migrations have the same name "${migrationName}" for ` +
      `config "${configUniqueKeyname}". Each migration name must be unique. Rename ` +
      `one of them and re-run.`,
    );

    Object.setPrototypeOf(this, MigrationDuplicateNameError.prototype);
  }
}
