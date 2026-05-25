import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {TraceStore} from "@pristine-ts/observability";
import {traceRenderer} from "@pristine-ts/telemetry";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";
import {TraceCommandOptions} from "./trace.command-options";

/**
 * Renders the span tree of one captured trace. Look it up by any of event/trace/request
 * id — `pristine trace <id>` tries all three, or use the explicit `--event-id`,
 * `--trace-id`, `--request-id` flags.
 *
 * `--format tree|flat|json` controls the rendering (defaults to `tree`).
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class TraceCommand implements CommandInterface<TraceCommandOptions> {
  optionsType = TraceCommandOptions;
  name = "p:trace";
  description = "Render the span tree of a captured trace by event/trace/request id.";

  constructor(
    private readonly cliOutput: CliOutput,
    private readonly traceStore: TraceStore,
  ) {
  }

  async run(args: TraceCommandOptions): Promise<ExitCode | number> {
    const lookupId = args.lookupId;
    if (lookupId === undefined) {
      this.cliOutput.writeLine("Usage: pristine trace <id> [--format tree|flat|json]");
      this.cliOutput.writeLine("       pristine trace --event-id <id> | --trace-id <id> | --request-id <id>");
      return ExitCode.Error;
    }

    const format = args.format ?? "tree";

    if (format === "json") {
      const serialized = this.traceStore.findSerialized(lookupId);
      if (serialized === undefined) {
        this.cliOutput.writeLine(`No trace found matching '${lookupId}'.`);
        return ExitCode.Error;
      }
      this.cliOutput.writeLine(JSON.stringify(serialized.trace, null, 2));
      return ExitCode.Success;
    }

    const found = this.traceStore.find(lookupId);
    if (found === undefined) {
      this.cliOutput.writeLine(`No trace found matching '${lookupId}'.`);
      return ExitCode.Error;
    }

    const rendered = format === "flat"
      ? traceRenderer.renderFlat(found.trace)
      : traceRenderer.renderTree(found.trace);
    this.cliOutput.writeLine(rendered);

    return ExitCode.Success;
  }
}
