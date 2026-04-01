import {MysqlConfig} from "../configs/mysql.config";

export interface MysqlConfigProviderInterface {
  getMysqlConfig(mysqlConfigUniqueKeyname: string): Promise<MysqlConfig>;

  supports(mysqlConfigUniqueKeyname: string): boolean;
}