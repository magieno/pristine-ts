import {ModuleInterface} from "@pristine-ts/common";
import {CliModuleKeyname} from "./cli.module.keyname";
import {CoreModule} from "@pristine-ts/core";
import {ValidationModule} from "@pristine-ts/validation";
import {LoggingModule} from "@pristine-ts/logging";
import {DataMappingModule} from "@pristine-ts/data-mapping"

export * from "./commands/commands";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./event-handlers/event-handlers";
export * from "./event-payloads/event-payloads";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./mappers/mappers";
export * from "./options/options";
export * from "./types/types";

export const CliModule: ModuleInterface = {
  keyname: CliModuleKeyname,
  configurationDefinitions: [],
  importModules: [
    CoreModule,
    DataMappingModule,
    LoggingModule,
    ValidationModule,
  ]
}
