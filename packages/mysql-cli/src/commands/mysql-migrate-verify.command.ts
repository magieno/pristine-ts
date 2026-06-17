import {ExitCode, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CommandInterface, CliOutput} from "@pristine-ts/cli";
import {MysqlCliModuleKeyname} from "../mysql-cli.module.keyname";
import {MysqlMigrationManager} from "../managers/mysql-migration.manager";
import {MysqlMigrateVerifyCommandOptions} from "./mysql-migrate-verify.command-options";

/**
 * `pristine mysql:verify [--config <keyname>]`
 *
 * Same scan as `mysql:status`, but exits non-zero if any Modified or Orphaned
 * entries exist. Designed for CI gates: a clean exit means the database and the
 * registered migrations are in agreement.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(MysqlCliModuleKeyname)
@injectable()
export class MysqlMigrateVerifyCommand implements CommandInterface<MysqlMigrateVerifyCommandOptions> {
  optionsType = MysqlMigrateVerifyCommandOptions;
  name = "mysql:verify";
  description = "Verify that all applied migrations match disk (exits non-zero on drift).";

  private static readonly DefaultConfigKeyname = "__default__";

  constructor(
    private readonly migrationManager: MysqlMigrationManager,
    private readonly cliOutput: CliOutput,
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
  }

  public async run(args: MysqlMigrateVerifyCommandOptions): Promise<ExitCode | number> {
    const configUniqueKeyname = args.config ?? MysqlMigrateVerifyCommand.DefaultConfigKeyname;

    try {
      await this.migrationManager.verify(configUniqueKeyname);
      this.cliOutput.writeLine(`mysql:verify  config=${configUniqueKeyname}  OK`);
      return ExitCode.Success;
    } catch (error) {
      this.logHandler.error("mysql:verify failed.", {highlights: {error: (error as Error).message}});
      return ExitCode.Error;
    }
  }
}
