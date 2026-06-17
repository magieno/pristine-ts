export interface MysqlConfig {
  uniqueKeyname: string,
  host: string,
  port: number,
  user: string,
  password: string,
  connectionLimit: number,
  debug: boolean,
  database: string,
  multipleStatements?: boolean,
  /**
   * Name of the bookkeeping table used by `@pristine-ts/mysql-cli` to track applied
   * SQL migrations. Defaults to `pristine_migrations`. Override only to match an
   * existing convention or to avoid a collision in a database shared with another
   * tool. Has no effect when `@pristine-ts/mysql-cli` is not in use.
   */
  migrationsTableName?: string,
}
