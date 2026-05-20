import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {PrettyLogFormatter} from "@pristine-ts/logging";
import {LogTailer, ObservabilityStoreReader} from "@pristine-ts/observability";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";

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
export class LogsCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:logs";
  description = "Show captured logs, optionally for one request, optionally following live.";

  constructor(
    private readonly cliOutput: CliOutput,
    private readonly storeReader: ObservabilityStoreReader,
  ) {
  }

  async run(args: any): Promise<ExitCode | number> {
    const runId = this.storeReader.resolveRunId(typeof args?.run === "string" ? args.run : undefined);
    if (runId === undefined) {
      this.cliOutput.writeLine("No observability runs found. Start your app with `pristine start` first.");
      return ExitCode.Success;
    }

    const traceId: string | undefined = Array.isArray(args?._) ? args._[0] : undefined;
    const follow = args?.follow === true || args?.f === true;

    for (const entry of this.storeReader.readLogs(runId)) {
      this.renderEntry(entry, traceId);
    }

    if (follow === false) {
      return ExitCode.Success;
    }

    return this.followLogs(this.storeReader.logsFilePath(runId), traceId);
  }

  /**
   * Tails the run's logs file, rendering each newly-appended line until SIGINT.
   */
  private followLogs(logsFilePath: string, traceId?: string): Promise<ExitCode | number> {
    return new Promise<ExitCode | number>((resolve) => {
      const tailer = new LogTailer(logsFilePath);
      tailer.follow((line) => {
        try {
          this.renderEntry(JSON.parse(line), traceId);
        } catch {
          // Skip a malformed line rather than aborting the follow.
        }
      });

      const onSigint = (): void => {
        tailer.stop();
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
