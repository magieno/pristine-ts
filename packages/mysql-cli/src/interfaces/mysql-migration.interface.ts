/**
 * Contract every MySQL migration class implements. Implementations are discovered by
 * the MysqlMigrationManager via the tsyringe DI container — register each class with
 * `@tag("MysqlMigrationInterface") @injectable()` and import it (directly or via a
 * MigrationsModule) into the AppModule's service graph.
 *
 * Migrations are forward-only by design. There is no `down()`. Roll forward by writing
 * a new migration.
 */
export interface MysqlMigrationInterface {
  /**
   * Unique, sortable identifier. Convention: `<NN>-<kebab-slug>` matching the filename
   * minus `.sql-migrations.ts`. Lexicographic sort across `name` defines the apply
   * order. Stored verbatim in pristine_migrations.filename.
   *
   * Use the convention. Manual identifiers break apply ordering and confuse the
   * scaffold command. `pristine mysql:create` produces compliant names automatically.
   */
  readonly name: string;

  /**
   * Which database configs this migration applies to. Each entry is a
   * `MysqlConfig.uniqueKeyname`.
   *
   * Leave undefined to apply to every registered config; set to an explicit list to
   * scope this migration to one or more specific databases — useful for multi-DB apps
   * where, say, a schema change only lands in the analytics DB.
   *
   * The CLI's `--config <keyname>` flag picks the database being targeted in this
   * invocation; a migration is selected for that invocation iff
   * `configUniqueKeynames === undefined || configUniqueKeynames.includes(targetConfig)`.
   */
  readonly configUniqueKeynames?: string[];

  /**
   * Returns the SQL to execute. The string may contain multiple statements separated
   * by `;`; the runner connection has `multipleStatements: true`. Async so migrations
   * can pull dynamic content — but the returned SQL MUST be deterministic across runs,
   * otherwise checksum-based drift detection will generate false positives.
   */
  up(): Promise<string> | string;
}
