import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {TraceCommand} from "./trace.command";
import {TraceCommandOptions} from "./trace.command-options";

/**
 * Top-level alias for `p:trace`.
 *
 * Declares the same `optionsType` as the command it delegates to — `optionsType = null`
 * hands `run()` the raw argument object, and `TraceCommandOptions` resolves the id it
 * looks up through a getter, which a raw object does not have. Without the mapping,
 * `pristine trace <id>` would print the usage line instead of the trace.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class TraceAliasCommand implements CommandInterface<TraceCommandOptions> {
  optionsType = TraceCommandOptions;
  name = "trace";
  description = "Alias for p:trace.";

  constructor(private readonly delegate: TraceCommand) {
  }

  async run(args: TraceCommandOptions): Promise<ExitCode | number> {
    return this.delegate.run(args);
  }
}
