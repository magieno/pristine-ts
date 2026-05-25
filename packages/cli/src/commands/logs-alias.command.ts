import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {LogsCommand} from "./logs.command";

/**
 * Top-level alias for `p:logs`.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class LogsAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "logs";
  description = "Alias for p:logs.";

  constructor(private readonly delegate: LogsCommand) {
  }

  async run(args: any): Promise<ExitCode | number> {
    return this.delegate.run(args);
  }
}
