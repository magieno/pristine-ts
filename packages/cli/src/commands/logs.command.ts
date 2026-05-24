import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {PrettyLogFormatter} from "@pristine-ts/logging";
import {LogStore} from "@pristine-ts/observability";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";
import {LogsCommandOptions} from "./logs.command-options";

/**
 * Renders captured logs: `pristine logs` for the whole latest run, `pristine logs <id>`
 * for one request's logs. With `--follow`/`-f` it streams new lines as they're appended
 * (Ctrl-C to stop). A pure report command: output goes through `CliOutput`.
 *
 * Flags: `--follow` / `-f`, `--run <id>` (defaults to the latest run).
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class LogsCommand implements CommandInterface<LogsCommandOptions> {
  optionsType = LogsCommandOptions;
  name = "p:logs";
  description = "Show captured logs, optionally for one request, optionally following live.";

  constructor(
    private readonly cliOutput: CliOutput,
    private readonly logStore: LogStore,
  ) {
  }

  async run(args: LogsCommandOptions): Promise<ExitCode | number> {
    const instanceId = args.run ?? this.logStore.latestInstanceId();
    if (instanceId === undefined) {
      this.cliOutput.writeLine("No captured observability data found. Run your app first.");
      return ExitCode.Success;
    }

    const traceId = args.traceId;

    for (const entry of this.logStore.read(instanceId)) {
      this.renderEntry(entry, traceId);
    }

    if (args.isFollowing === false) {
      return ExitCode.Success;
    }

    return this.followLogs(instanceId, traceId);
  }

  /**
   * Tails the instance's logs file, rendering each newly-appended line until SIGINT.
   */
  private followLogs(instanceId: string, traceId?: string): Promise<ExitCode | number> {
    return new Promise<ExitCode | number>((resolve) => {
      const handle = this.logStore.tail(instanceId, (line) => {
        try {
          this.renderEntry(JSON.parse(line), traceId);
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
   * Renders one stored log entry through `PrettyLogFormatter`. Skips entries that don't
   * match the requested trace/event id filter, when one was given.
   */
  private renderEntry(entry: Record<string, any>, traceId?: string): void {
    if (traceId !== undefined && entry.traceId !== traceId && entry.eventId !== traceId) {
      return;
    }

    // The store keeps `date` as an ISO string and `severity` as a numeric SeverityEnum —
    // rehydrate the date so PrettyLogFormatter (date-fns) can format it.
    entry.date = new Date(entry.date);
    this.cliOutput.writeLine(PrettyLogFormatter.format(entry as any));
  }
}
