import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {PrettyLogFormatter} from "@pristine-ts/logging";
import {LogStore} from "@pristine-ts/observability";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";
import {LogsCommandOptions} from "./logs.command-options";

/**
 * Renders captured logs: `pristine logs` for everything (newest first across all
 * processes), `pristine logs <id>` to filter by any of event/trace/request id, or
 * the explicit `--event-id` / `--trace-id` / `--request-id` flags. With `--follow`/`-f`
 * it tails the live writers (Ctrl-C to stop). A pure report command: output goes
 * through `CliOutput`.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class LogsCommand implements CommandInterface<LogsCommandOptions> {
  optionsType = LogsCommandOptions;
  name = "p:logs";
  description = "Show captured logs, optionally filtered by event/trace/request id, optionally following live.";

  constructor(
    private readonly cliOutput: CliOutput,
    private readonly logStore: LogStore,
  ) {
  }

  async run(args: LogsCommandOptions): Promise<ExitCode | number> {
    const filterId = args.filterId;
    const entries = this.logStore.read(filterId);

    if (entries.length === 0 && args.isFollowing === false) {
      this.cliOutput.writeLine(filterId === undefined
        ? "No captured observability data found. Run your app first."
        : `No logs found matching '${filterId}'.`);
      return ExitCode.Success;
    }

    for (const entry of entries) {
      this.render(entry);
    }

    if (args.isFollowing === false) {
      return ExitCode.Success;
    }

    return this.followLogs(filterId);
  }

  /**
   * Tails live writes, rendering each newly-appended line until SIGINT.
   */
  private followLogs(filterId?: string): Promise<ExitCode | number> {
    return new Promise<ExitCode | number>((resolve) => {
      const handle = this.logStore.tail(filterId, (line) => {
        try {
          this.render(JSON.parse(line));
        } catch {
          // Skip a malformed line rather than aborting the follow.
        }
      });

      const onSigint = (): void => {
        handle.stop();
        process.off("SIGINT", onSigint);
        resolve(ExitCode.Success);
      };
      process.on("SIGINT", onSigint);
    });
  }

  /**
   * Renders one stored log entry through `PrettyLogFormatter`. The store keeps `date`
   * as an ISO string and `severity` as a numeric `SeverityEnum`; rehydrate the date so
   * the formatter (date-fns) can format it.
   */
  private render(entry: Record<string, any>): void {
    entry.date = new Date(entry.date);
    this.cliOutput.writeLine(PrettyLogFormatter.format(entry as any));
  }
}
