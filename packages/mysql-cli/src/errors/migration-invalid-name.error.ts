/**
 * Thrown when a registered migration's `name` doesn't satisfy the
 * `<NN>-<kebab-slug>` regex (`/^\d+-[a-z0-9-]+$/`). Indicates a hand-edited or
 * misnamed migration class. The fix is to rename to the convention and update the
 * `name` field.
 */
export class MigrationInvalidNameError extends Error {
  public constructor(
    public readonly migrationName: string,
  ) {
    super(
      `Migration name "${migrationName}" does not match the required pattern ` +
      `<NN>-<kebab-slug> (e.g. "01-init", "02-add-users-table"). Rename the ` +
      `class file and update its \`name\` field to match.`,
    );

    Object.setPrototypeOf(this, MigrationInvalidNameError.prototype);
  }
}
