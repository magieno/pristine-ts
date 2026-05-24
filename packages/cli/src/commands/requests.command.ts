import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {TraceStore} from "@pristine-ts/observability";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";
import {RequestsCommandOptions} from "./requests.command-options";

/**
 * Lists recent requests captured in the observability store — the entry point for
 * "what just happened, and what's the trace id I want to inspect?".
 *
 * Reads the latest run's `requests.jsonl` index (or `--run <id>`), newest first. A pure
 * report command: all output goes through `CliOutput` so it pipes cleanly.
 *
 * Flags: `--limit <n>` (default 20), `--run <id>` (defaults to the latest run).
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class RequestsCommand implements CommandInterface<RequestsCommandOptions> {
  optionsType = RequestsCommandOptions;
  name = "p:requests";
  description = "List recent requests captured in the observability store.";

  private static readonly DEFAULT_LIMIT = 20;

  constructor(
    private readonly cliOutput: CliOutput,
    private readonly traceStore: TraceStore,
  ) {
  }

  async run(args: RequestsCommandOptions): Promise<ExitCode | number> {
    const instanceId = args.run ?? this.traceStore.latestInstanceId();
    if (instanceId === undefined) {
      this.cliOutput.writeLine("No captured observability data found. Run your app first.");
      return ExitCode.Success;
    }

    const limit = args.limit ?? RequestsCommand.DEFAULT_LIMIT;
    const summaries = this.traceStore.recentRequests(instanceId, limit);

    if (summaries.length === 0) {
      this.cliOutput.writeLine(`Instance ${instanceId} has no recorded requests yet.`);
      return ExitCode.Success;
    }

    const headers = ["TIME", "METHOD", "PATH", "STATUS", "DURATION", "TRACE"];
    const rows = summaries.map(summary => [
      new Date(summary.startedAt).toTimeString().slice(0, 8),
      summary.httpMethod ?? "-",
      summary.httpPath ?? summary.rootKeyname,
      summary.httpStatus !== undefined ? String(summary.httpStatus) : "-",
      `${summary.durationMs}ms`,
      summary.traceId,
    ]);

    for (const line of this.renderTable(headers, rows)) {
      this.cliOutput.writeLine(line);
    }

    return ExitCode.Success;
  }

  private renderTable(headers: string[], rows: string[][]): string[] {
    const widths = headers.map((header, column) =>
      Math.max(header.length, ...rows.map(row => row[column].length)));
    const formatRow = (cells: string[]): string =>
      cells.map((cell, column) => cell.padEnd(widths[column])).join("  ").trimEnd();
    return [formatRow(headers), ...rows.map(formatRow)];
  }
}
