import {SqliteConfigProviderInterface} from "../interfaces/sqlite-config-provider.interface";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {SqliteConfig} from "../configs/sqlite.config";
import {injectable, injectAll} from "tsyringe";

@tag("SqliteConfigProviderInterface")
@injectable()
export class DefaultSqliteConfigProvider implements SqliteConfigProviderInterface {
  constructor(
    @injectAll(ServiceDefinitionTagEnum.SqliteConfig) private readonly sqliteConfigs: SqliteConfig[],) {
  }

  public async getSqliteConfig(sqliteConfigUniqueKeyname: string): Promise<SqliteConfig> {
    const sqliteConfig = this.sqliteConfigs.find((sqliteConfig) => sqliteConfig.uniqueKeyname === sqliteConfigUniqueKeyname);

    if (sqliteConfig === undefined) {
      throw new Error(`The sqlite config with the unique keyname ${sqliteConfigUniqueKeyname} does not exist.`);
    }

    return sqliteConfig;
  }

  public supports(sqliteConfigUniqueKeyname: string): boolean {
    return this.sqliteConfigs.some((sqliteConfig) => sqliteConfig.uniqueKeyname === sqliteConfigUniqueKeyname);
  }
}
