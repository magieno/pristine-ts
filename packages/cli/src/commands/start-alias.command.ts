import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {StartCommand} from "./start.command";
import {StartCommandOptions} from "./start.command-options";

/**
 * Top-level alias for the framework-reserved `p:start` command. Injects the delegate
 * directly via standard DI.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class StartAliasCommand implements CommandInterface<StartCommandOptions> {
  optionsType = StartCommandOptions;
  name = "start";
  description = "Alias for p:start.";

  constructor(private readonly delegate: StartCommand) {
  }

  async run(args: StartCommandOptions): Promise<ExitCode | number> {
    return this.delegate.run(args);
  }
}
