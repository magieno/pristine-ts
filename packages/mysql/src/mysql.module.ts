import {CommonModule, ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {ConfigurationModule} from "@pristine-ts/configuration";
import {MysqlModuleKeyname} from "./mysql.module.keyname";


export * from "./clients/clients";
export * from "./config-providers/config-providers";
export * from "./configs/configs";
export * from "./interfaces/interfaces";

export * from "./mysql.module.keyname";

// The entity decorators, naming strategies and search models moved to
// @pristine-ts/database-common (shared with @pristine-ts/sqlite); re-exported here so
// existing imports from @pristine-ts/mysql keep working.
export * from "@pristine-ts/database-common";

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
