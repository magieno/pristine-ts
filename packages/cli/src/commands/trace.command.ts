import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {ObservabilityStoreReader, TraceDeserializer} from "@pristine-ts/observability";
import {traceRenderer} from "@pristine-ts/telemetry";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";

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
export class TraceCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:trace";
  description = "Render the span tree of a captured trace by its id.";

  constructor(
    private readonly cliOutput: CliOutput,
    private readonly storeReader: ObservabilityStoreReader,
  ) {
  }

  async run(args: any): Promise<ExitCode | number> {
    const traceId: string | undefined = Array.isArray(args?._) ? args._[0] : undefined;
    if (traceId === undefined) {
      this.cliOutput.writeLine("Usage: pristine trace <traceId> [--format tree|flat|json] [--run <runId>]");
      return ExitCode.Error;
    }

    const preferredRun = typeof args?.run === "string" ? args.run : undefined;
    const found = this.storeReader.findTrace(traceId, preferredRun);
    if (found === undefined) {
      this.cliOutput.writeLine(`Trace '${traceId}' not found in the observability store.`);
      return ExitCode.Error;
    }

    const format = typeof args?.format === "string" ? args.format : "tree";

    if (format === "json") {
      this.cliOutput.writeLine(JSON.stringify(found.trace, null, 2));
      return ExitCode.Success;
    }

    const trace = TraceDeserializer.deserialize(found.trace);
    const rendered = format === "flat"
      ? traceRenderer.renderFlat(trace)
      : traceRenderer.renderTree(trace);
    this.cliOutput.writeLine(rendered);

    return ExitCode.Success;
  }
}
