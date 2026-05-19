import {ModuleInterface} from "@pristine-ts/common";
import {CliModuleKeyname} from "./cli.module.keyname";
import {CoreModule} from "@pristine-ts/core";
import {ValidationModule} from "@pristine-ts/validation";
import {LoggingModule, LoggingModuleKeyname, OutputModeEnum, SeverityEnum} from "@pristine-ts/logging";
import {DataMappingModule} from "@pristine-ts/data-mapping"

export * from "./bootstrap/bootstrap";
export * from "./commands/commands";
export * from "./config/config";
export * from "./errors/errors";
export * from "./event-handlers/event-handlers";
export * from "./event-payloads/event-payloads";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./mappers/mappers";
export * from "./options/options";
export * from "./reporters/cli-error.reporter";
export * from "./types/types";

// Re-export the `Cli` entrypoint so `bin.ts` (and any other downstream entry script) can
// invoke `new (require('@pristine-ts/cli').Cli)().bootstrap()` to load the same physical
// CLI classes the consumer's AppModule references — avoiding cross-realm decorator
// metadata mismatches that occur when bin and consumer end up with separate copies.
export {Cli} from "./cli";

export const CliModule: ModuleInterface = {
  keyname: CliModuleKeyname,
  configurationDefinitions: [],
  importModules: [
    CoreModule,
    DataMappingModule,
    LoggingModule,
    ValidationModule,
  ],
  /**
   * When running through the CLI, logs share stderr with our own CLI output. We layer a
   * tighter set of defaults than `LoggingModule` ships with so the terminal stays
   * readable: Simple line-oriented format and `Error`-only severity threshold. Users can
   * override both in `pristine.config.ts:config` or via env-var resolvers — `configDefaults`
   * sits below the file and overrides in the resolution chain.
   *
   * No `isLoggingModulePresent` check needed — `LoggingModule` is a hard import above, so
   * these keys are always registered when CliModule is in the graph. (And if a future
   * refactor removed LoggingModule from this import list, the kernel would throw at boot
   * with an actionable "unknown key" error — the right failure mode for that case.)
   */
  configDefaults: {
    [LoggingModuleKeyname + ".consoleLoggerOutputMode"]: OutputModeEnum.Simple,
    [LoggingModuleKeyname + ".logSeverityLevelConfiguration"]: SeverityEnum.Error,
  },
}
