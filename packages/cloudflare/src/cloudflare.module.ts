import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {CloudflareModuleKeyname} from "./cloudflare.module.keyname";

export * from "./mappers/mappers";

export const CloudflareModule: ModuleInterface = {
  keyname: CloudflareModuleKeyname,
  importModules: [
    CommonModule,
    LoggingModule,
  ],
  providerRegistrations: [],
  configurationDefinitions: []
}
