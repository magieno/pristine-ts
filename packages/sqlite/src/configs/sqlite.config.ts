import {SqliteJournalModeEnum} from "../enums/sqlite-journal-mode.enum";

export interface SqliteConfig {
  uniqueKeyname: string,

  /**
   * Path to the database file, or `:memory:` for an in-memory database.
   */
  filename: string,

  /**
   * Opens the database in read-only mode. The file must already exist.
   *
   * Default: `false`
   */
  readOnly?: boolean,

  /**
   * Enforces `FOREIGN KEY` constraints, which SQLite does not enforce out of the box.
   *
   * Default: `true`
   */
  enableForeignKeyConstraints?: boolean,

  /**
   * Journal mode applied (via `PRAGMA journal_mode`) to file-backed databases. Ignored for
   * `:memory:` databases and read-only connections.
   *
   * Default: `SqliteJournalModeEnum.Wal`
   */
  journalMode?: SqliteJournalModeEnum,

  /**
   * How long a statement waits (in milliseconds) when the database is locked by another
   * connection before failing with `SQLITE_BUSY`.
   *
   * Default: `5000`
   */
  busyTimeoutMs?: number,

  /**
   * Name of the bookkeeping table that a future `@pristine-ts/sqlite-cli` will use to track
   * applied SQL migrations. Reserved for parity with `MysqlConfig.migrationsTableName`.
   */
  migrationsTableName?: string,
}
