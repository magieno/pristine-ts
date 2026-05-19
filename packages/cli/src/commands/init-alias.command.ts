import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {InitCommand} from "./init.command";
import {InitCommandOptions} from "./init.command-options";

/**
 * Top-level alias for the framework-reserved `p:init` command. Injects the delegate
 * directly via standard DI.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class InitAliasCommand implements CommandInterface<InitCommandOptions> {
  optionsType = InitCommandOptions;
  name = "init";
  description = "Alias for p:init.";

  constructor(private readonly delegate: InitCommand) {
  }

  async run(args: InitCommandOptions): Promise<ExitCode | number> {
    return this.delegate.run(args);
  }
}
