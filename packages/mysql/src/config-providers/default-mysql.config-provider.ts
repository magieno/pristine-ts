import {MysqlConfigProviderInterface} from "../interfaces/mysql-config-provider.interface";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {MysqlConfig} from "../configs/mysql.config";
import {injectable, injectAll} from "tsyringe";

@tag("MysqlConfigProviderInterface")
@injectable()
export class DefaultMysqlConfigProvider implements MysqlConfigProviderInterface {
  constructor(
    @injectAll(ServiceDefinitionTagEnum.MysqlConfig) private readonly mysqlConfigs: MysqlConfig[],) {
  }

  public async getMysqlConfig(mysqlConfigUniqueKeyname: string): Promise<MysqlConfig> {
    const mysqlConfig = this.mysqlConfigs.find((mysqlConfig) => mysqlConfig.uniqueKeyname === mysqlConfigUniqueKeyname);

    if (mysqlConfig === undefined) {
      throw new Error(`The mysql config with the unique keyname ${mysqlConfigUniqueKeyname} does not exist.`);
    }

    return mysqlConfig;
  }

  public supports(mysqlConfigUniqueKeyname: string): boolean {
    return this.mysqlConfigs.some((mysqlConfig) => mysqlConfig.uniqueKeyname === mysqlConfigUniqueKeyname);
  }
}