import {CommonModule, ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {ConfigurationModule} from "@pristine-ts/configuration";
import {SqliteModuleKeyname} from "./sqlite.module.keyname";


export * from "./clients/clients";
export * from "./config-providers/config-providers";
export * from "./configs/configs";
export * from "./enums/enums";
export * from "./interfaces/interfaces";

export * from "./sqlite.module.keyname";

export const SqliteModule: ModuleInterface = {
  keyname: SqliteModuleKeyname,
  importModules: [
    CommonModule,
    ConfigurationModule,
  ],
  configurationDefinitions: [],
  providerRegistrations: [
    {
      token: ServiceDefinitionTagEnum.SqliteConfig,
      useValue: {
        uniqueKeyname: "__default__",
        filename: "",
      }
    }
  ]
};
