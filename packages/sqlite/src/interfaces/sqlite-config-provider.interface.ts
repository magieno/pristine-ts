import {SqliteConfig} from "../configs/sqlite.config";

export interface SqliteConfigProviderInterface {
  getSqliteConfig(sqliteConfigUniqueKeyname: string): Promise<SqliteConfig>;

  supports(sqliteConfigUniqueKeyname: string): boolean;
}
