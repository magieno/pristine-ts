import path from "path";
import {ExitCode, injectConfig, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CommandInterface, CliOutput} from "@pristine-ts/cli";
import {MysqlCliModuleKeyname} from "../mysql-cli.module.keyname";
import {MysqlCliConfigurationKeys} from "../mysql-cli.configuration-keys";
import {MysqlMigrationScaffoldManager} from "../managers/mysql-migration-scaffold.manager";
import {MysqlMigrateCreateCommandOptions} from "./mysql-migrate-create.command-options";

/**
 * `pristine mysql:create <name> [--config <keyname>]`
 *
 * Scaffolds a new `.sql-migrations.ts` file under the configured scaffold path
 * (`pristine.mysql-cli.scaffold.path`, default `src/sql-migrations`). When the
 * config key `pristine.mysql-cli.scaffold.barrelPath` is set, splices the new
 * import and class reference into that file between the marker comments
 * `<pristine:migration-imports:start/end>` and `<pristine:migration-services:start/end>`.
 *
 * Numbering is sequential: the scaffold scans the target directory for files
 * matching `<digits>-<slug>.sql-migrations.ts`, picks `max + 1`, pads to the
 * existing width (default 2). If you cross 99, do a one-time rename of the
 * existing files to 3-digit width and the scaffold respects it going forward.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(MysqlCliModuleKeyname)
@injectable()
export class MysqlMigrateCreateCommand implements CommandInterface<MysqlMigrateCreateCommandOptions> {
  optionsType = MysqlMigrateCreateCommandOptions;
  name = "mysql:create";
  description = "Scaffold a new SQL migration class with the next sequential number.";

  constructor(
    @injectConfig(MysqlCliConfigurationKeys.ScaffoldPath) private readonly scaffoldPath: string,
    @injectConfig(MysqlCliConfigurationKeys.ScaffoldBarrelPath) private readonly scaffoldBarrelPath: string,
    private readonly scaffoldManager: MysqlMigrationScaffoldManager,
    private readonly cliOutput: CliOutput,
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
  }

  public async run(args: MysqlMigrateCreateCommandOptions): Promise<ExitCode | number> {
    const descriptiveName = args.descriptiveName;
    if (descriptiveName === undefined || descriptiveName.length === 0) {
      this.logHandler.error("mysql:create requires a descriptive name (e.g. `pristine mysql:create add-products-table`).");
      return ExitCode.Error;
    }

    const projectRoot = process.cwd();
    const absoluteScaffoldPath = path.resolve(projectRoot, this.scaffoldPath);
    const absoluteBarrelPath = this.scaffoldBarrelPath.length > 0
      ? path.resolve(projectRoot, this.scaffoldBarrelPath)
      : undefined;

    try {
      const result = await this.scaffoldManager.create({
        scaffoldPath: absoluteScaffoldPath,
        descriptiveName,
        barrelPath: absoluteBarrelPath,
        configUniqueKeynames: args.config !== undefined ? [args.config] : undefined,
      });

      this.cliOutput.writeLine(`✓ Created ${path.relative(projectRoot, result.filePath)}`);
      if (result.barrelUpdated) {
        this.cliOutput.writeLine(`✓ Updated ${path.relative(projectRoot, absoluteBarrelPath!)}`);
      } else if (absoluteBarrelPath !== undefined) {
        this.cliOutput.writeLine(`! Barrel not auto-edited at ${path.relative(projectRoot, absoluteBarrelPath)} — see warnings above.`);
        this.printManualInstructions(result.className, result.migrationName);
      } else {
        this.cliOutput.writeLine("");
        this.printManualInstructions(result.className, result.migrationName);
      }

      return ExitCode.Success;
    } catch (error) {
      this.logHandler.error("mysql:create failed.", {highlights: {error: (error as Error).message}});
      return ExitCode.Error;
    }
  }

  private printManualInstructions(className: string, migrationName: string): void {
    this.cliOutput.writeLine("Next step: register the migration with the kernel. Add to your migrations module:");
    this.cliOutput.writeLine("");
    this.cliOutput.writeLine(`  import {${className}} from "./${migrationName}.sql-migrations";`);
    this.cliOutput.writeLine("");
    this.cliOutput.writeLine(`  importServices: [..., ${className}],`);
    this.cliOutput.writeLine("");
    this.cliOutput.writeLine(
      "Tip: set `pristine.mysql-cli.scaffold.barrelPath` in pristine.config.ts to have " +
      "this command auto-edit your migrations module on future scaffolds.",
    );
  }
}
