import {inject, injectable, injectAll} from "tsyringe";
import {createConnection} from "mysql2/promise";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {MysqlConfig, MysqlConfigProviderInterface} from "@pristine-ts/mysql";
import {MigrationExecutionError} from "../errors/migration-execution.error";

/**
 * Executes a single migration's SQL string against a target database. Opens a
 * one-shot mysql2 connection with `multipleStatements: true` for the call and
 * closes it in `finally` — does NOT touch the cached `MysqlClient` pool because
 * flipping `multipleStatements` on the pool would leak to every other consumer
 * of the client. A dedicated connection per migration is the cleanest isolation.
 */
@injectable()
export class MysqlMigrationRunner {
  constructor(
    @injectAll("MysqlConfigProviderInterface") private readonly mysqlConfigProviders: MysqlConfigProviderInterface[],
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
  }

  public async execute(configUniqueKeyname: string, migrationName: string, sql: string): Promise<number> {
    const config = await this.resolveConfig(configUniqueKeyname);

    const connection = await createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      debug: config.debug,
      multipleStatements: true,
    });

    const startedAt = Date.now();

    try {
      await connection.query(sql);
      const executionTimeMs = Date.now() - startedAt;

      this.logHandler.debug("MysqlMigrationRunner: migration executed successfully.", {
        highlights: {configUniqueKeyname, migrationName, executionTimeMs},
      });

      return executionTimeMs;
    } catch (error) {
      this.logHandler.error("MysqlMigrationRunner: migration execution failed.", {
        highlights: {configUniqueKeyname, migrationName, error},
      });

      throw new MigrationExecutionError(migrationName, configUniqueKeyname, error as Error);
    } finally {
      try {
        await connection.end();
      } catch (closeError) {
        this.logHandler.warning("MysqlMigrationRunner: failed to close migration connection cleanly.", {
          highlights: {configUniqueKeyname, migrationName, error: closeError},
        });
      }
    }
  }

  private async resolveConfig(configUniqueKeyname: string): Promise<MysqlConfig> {
    const provider = this.mysqlConfigProviders.find((p) => p.supports(configUniqueKeyname));

    if (provider === undefined) {
      throw new Error(`No MysqlConfigProvider supports the unique keyname "${configUniqueKeyname}".`);
    }

    return provider.getMysqlConfig(configUniqueKeyname);
  }
}
