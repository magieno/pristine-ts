import {ExitCode, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CommandInterface, CliOutput} from "@pristine-ts/cli";
import {MysqlCliModuleKeyname} from "../mysql-cli.module.keyname";
import {MysqlMigrationManager} from "../managers/mysql-migration.manager";
import {MigrationStateEnum} from "../enums/migration-state.enum";
import {MysqlMigrateStatusCommandOptions} from "./mysql-migrate-status.command-options";

/**
 * `pristine mysql:status [--config <keyname>]`
 *
 * Prints the disk-vs-database diff. Reports each migration as Pending, Applied,
 * Modified, or Orphaned. Informational only — always exits 0. Use `mysql:verify`
 * to fail on drift.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(MysqlCliModuleKeyname)
@injectable()
export class MysqlMigrateStatusCommand implements CommandInterface<MysqlMigrateStatusCommandOptions> {
  optionsType = MysqlMigrateStatusCommandOptions;
  name = "mysql:status";
  description = "Show the disk-vs-database status of MySQL migrations.";

  private static readonly DefaultConfigKeyname = "__default__";

  constructor(
    private readonly migrationManager: MysqlMigrationManager,
    private readonly cliOutput: CliOutput,
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
  }

  public async run(args: MysqlMigrateStatusCommandOptions): Promise<ExitCode | number> {
    const configUniqueKeyname = args.config ?? MysqlMigrateStatusCommand.DefaultConfigKeyname;

    try {
      const plan = await this.migrationManager.status(configUniqueKeyname);

      this.cliOutput.writeLine(`config: ${plan.configUniqueKeyname}   table: ${plan.tableName}`);
      for (const entry of plan.entries) {
        const label = this.formatState(entry.state);
        const suffix = this.formatSuffix(entry);
        this.cliOutput.writeLine(`  ${label} ${entry.name}${suffix}`);
      }

      this.cliOutput.writeLine(
        `Summary: ${plan.countByState(MigrationStateEnum.Pending)} pending, ` +
        `${plan.countByState(MigrationStateEnum.Applied)} applied, ` +
        `${plan.countByState(MigrationStateEnum.Modified)} modified, ` +
        `${plan.countByState(MigrationStateEnum.Orphaned)} orphaned`,
      );

      return ExitCode.Success;
    } catch (error) {
      this.logHandler.error("mysql:status failed.", {highlights: {error: (error as Error).message}});
      return ExitCode.Error;
    }
  }

  private formatState(state: MigrationStateEnum): string {
    switch (state) {
      case MigrationStateEnum.Pending:  return "Pending ";
      case MigrationStateEnum.Applied:  return "Applied ";
      case MigrationStateEnum.Modified: return "Modified";
      case MigrationStateEnum.Orphaned: return "Orphaned";
    }
  }

  private formatSuffix(entry: {state: MigrationStateEnum; appliedAt?: Date}): string {
    if (entry.state === MigrationStateEnum.Applied && entry.appliedAt !== undefined) {
      return `   (applied ${entry.appliedAt.toISOString()})`;
    }
    if (entry.state === MigrationStateEnum.Modified) {
      return `   (checksum drift)`;
    }
    if (entry.state === MigrationStateEnum.Orphaned) {
      return `   (in DB, not registered)`;
    }
    return "";
  }
}
