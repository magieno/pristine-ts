import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {TraceStore} from "@pristine-ts/observability";
import {traceRenderer} from "@pristine-ts/telemetry";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";
import {TraceCommandOptions} from "./trace.command-options";

/**
 * Renders the span tree of one captured trace: `pristine trace <traceId>`.
 *
 * The trace id is also the eventId / request id — copy it straight from `pristine
 * requests`. A pure report command: output goes through `CliOutput`.
 *
 * Flags: `--format tree|flat|json` (default `tree`), `--run <id>` (defaults to searching
 * the latest run, then older runs).
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class TraceCommand implements CommandInterface<TraceCommandOptions> {
  optionsType = TraceCommandOptions;
  name = "p:trace";
  description = "Render the span tree of a captured trace by its id.";

  constructor(
    private readonly cliOutput: CliOutput,
    private readonly traceStore: TraceStore,
  ) {
  }

  async run(args: TraceCommandOptions): Promise<ExitCode | number> {
    const traceId = args.traceId;
    if (traceId === undefined) {
      this.cliOutput.writeLine("Usage: pristine trace <traceId> [--format tree|flat|json] [--run <runId>]");
      return ExitCode.Error;
    }

    const format = args.format ?? "tree";

    if (format === "json") {
      const serialized = this.traceStore.findSerialized(traceId, args.run);
      if (serialized === undefined) {
        this.cliOutput.writeLine(`Trace '${traceId}' not found in the observability store.`);
        return ExitCode.Error;
      }
      this.cliOutput.writeLine(JSON.stringify(serialized.trace, null, 2));
      return ExitCode.Success;
    }

    const found = this.traceStore.find(traceId, args.run);
    if (found === undefined) {
      this.cliOutput.writeLine(`Trace '${traceId}' not found in the observability store.`);
      return ExitCode.Error;
    }

    const rendered = format === "flat"
      ? traceRenderer.renderFlat(found.trace)
      : traceRenderer.renderTree(found.trace);
    this.cliOutput.writeLine(rendered);

    return ExitCode.Success;
  }
}
