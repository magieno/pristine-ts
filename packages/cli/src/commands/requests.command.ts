import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {ObservabilityStoreReader} from "@pristine-ts/observability";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";

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
export class RequestsCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:requests";
  description = "List recent requests captured in the observability store.";

  private static readonly DEFAULT_LIMIT = 20;

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

    const limit = typeof args?.limit === "number" ? args.limit : RequestsCommand.DEFAULT_LIMIT;
    const summaries = this.storeReader.readRequests(runId, limit);

    if (summaries.length === 0) {
      this.cliOutput.writeLine(`Run ${runId} has no recorded requests yet.`);
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
