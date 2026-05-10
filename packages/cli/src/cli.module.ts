import {ModuleInterface} from "@pristine-ts/common";
import {CliModuleKeyname} from "./cli.module.keyname";
import {CoreModule} from "@pristine-ts/core";
import {ValidationModule} from "@pristine-ts/validation";
import {LoggingModule} from "@pristine-ts/logging";
import {DataMappingModule} from "@pristine-ts/data-mapping"

export * from "./commands/commands";
export * from "./config/config";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./event-handlers/event-handlers";
export * from "./event-payloads/event-payloads";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./mappers/mappers";
export * from "./options/options";
export * from "./types/types";

// Re-export the bootstrap entrypoint so `bin.ts` (and any other downstream entry script)
// can invoke `require('@pristine-ts/cli').bootstrap()` to load the same physical CLI
// classes the consumer's AppModule references — avoiding cross-realm decorator metadata
// mismatches that occur when bin and consumer end up with separate copies.
export {bootstrap} from "./cli";

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
