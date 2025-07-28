import {CommonModule, ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {ConfigurationModule} from "@pristine-ts/configuration";
import {MysqlModuleKeyname} from "./mysql.module.keyname";


export * from "./clients/clients";
export * from "./config-providers/config-providers";
export * from "./configs/configs";
export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./interfaces/interfaces";
export * from "./strategies/strategies";
export * from "./types/types";

export * from "./mysql.module.keyname";

export const MysqlModule: ModuleInterface = {
  keyname: MysqlModuleKeyname,
  importModules: [
    CommonModule,
    ConfigurationModule,
  ],
  configurationDefinitions: [],
  providerRegistrations: [
    {
      token: ServiceDefinitionTagEnum.MysqlConfig,
      useValue: {
        uniqueKeyname: "__default__",
        host: "",
        port: 0,
        user: "",
        password: "",
        connectionLimit: 0,
        debug: false,
        database: "",
      }
    }
  ]
};
