import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {CliModule} from "@pristine-ts/cli";
import {CoreModule} from "@pristine-ts/core";
import {FileModule} from "@pristine-ts/file";
import {LoggingModule} from "@pristine-ts/logging";
import {MysqlModule} from "@pristine-ts/mysql";
import {MysqlCliModuleKeyname} from "./mysql-cli.module.keyname";

export * from "./commands/commands";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./models/models";
export * from "./mysql-cli.configuration-keys";
export * from "./mysql-cli.module.keyname";

export const MysqlCliModule: ModuleInterface = {
  keyname: MysqlCliModuleKeyname,
  importModules: [
    CommonModule,
    CoreModule,
    CliModule,
    FileModule,
    LoggingModule,
    MysqlModule,
  ],
  configurationDefinitions: [
    {
      // The directory `mysql:create` writes new migration files into. Resolved against
      // `process.cwd()` at command time. Override per-project in pristine.config.ts.
      parameterName: MysqlCliModuleKeyname + ".scaffold.path",
      isRequired: false,
      defaultValue: "src/sql-migrations",
    },
    {
      // When set to a non-empty path, `mysql:create` auto-edits the file at this
      // path to splice in the new import and class reference between marker
      // comments. Empty string (the default) means "not configured" — the command
      // prints manual registration instructions instead. Single field = single
      // signal — no separate enable flag.
      parameterName: MysqlCliModuleKeyname + ".scaffold.barrelPath",
      isRequired: false,
      defaultValue: "",
    },
  ],
};
