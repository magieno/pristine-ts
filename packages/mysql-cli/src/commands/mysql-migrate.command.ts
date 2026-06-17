import {ExitCode, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CommandInterface, CliOutput} from "@pristine-ts/cli";
import {MysqlCliModuleKeyname} from "../mysql-cli.module.keyname";
import {MysqlMigrationManager} from "../managers/mysql-migration.manager";
import {MysqlMigrateCommandOptions} from "./mysql-migrate.command-options";

/**
 * `pristine mysql:migrate [--config <keyname>] [--dry-run] [--force]`
 *
 * Applies every Pending migration against the targeted database. Halts on the first
 * failure. Refuses to proceed when drift (Modified / Orphaned entries) exists unless
 * `--force` is given.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(MysqlCliModuleKeyname)
@injectable()
export class MysqlMigrateCommand implements CommandInterface<MysqlMigrateCommandOptions> {
  optionsType = MysqlMigrateCommandOptions;
  name = "mysql:migrate";
  description = "Apply pending MySQL migrations against the configured database.";

  private static readonly DefaultConfigKeyname = "__default__";

  constructor(
    private readonly migrationManager: MysqlMigrationManager,
    private readonly cliOutput: CliOutput,
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
  }

  public async run(args: MysqlMigrateCommandOptions): Promise<ExitCode | number> {
    const configUniqueKeyname = args.config ?? MysqlMigrateCommand.DefaultConfigKeyname;

    try {
      const result = await this.migrationManager.apply(configUniqueKeyname, {
        dryRun: args["dry-run"] === true,
        force: args.force === true,
      });

      this.cliOutput.writeLine(`Applying migrations against config: ${configUniqueKeyname}${result.dryRun ? "  (dry-run)" : ""}`);
      for (const entry of result.appliedMigrations) {
        this.cliOutput.writeLine(`  ✓ ${entry.name}  (${entry.executionTimeMs} ms)`);
      }

      if (result.failedMigration !== undefined) {
        this.cliOutput.writeLine(`  ✗ ${result.failedMigration.name}  (failed)`);
        this.logHandler.error(`Migration ${result.failedMigration.name} failed: ${result.failedMigration.error}`);
        return ExitCode.Error;
      }

      this.cliOutput.writeLine(`Applied ${result.appliedMigrations.length} migration(s). ${result.skippedAlreadyApplied.length} skipped.`);
      return ExitCode.Success;
    } catch (error) {
      this.logHandler.error("mysql:migrate failed.", {highlights: {error: (error as Error).message}});
      return ExitCode.Error;
    }
  }
}
