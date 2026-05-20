import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {TraceCommand} from "./trace.command";

/**
 * Top-level alias for `p:trace`.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class TraceAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "trace";
  description = "Alias for p:trace.";

  constructor(private readonly delegate: TraceCommand) {
  }

  async run(args: any): Promise<ExitCode | number> {
    return this.delegate.run(args);
  }
}
