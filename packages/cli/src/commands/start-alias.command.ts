import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {Kernel} from "@pristine-ts/core";
import {CommandInterface} from "../interfaces/command.interface";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {StartCommand} from "./start.command";
import {StartCommandOptions} from "./start.command-options";

/**
 * Top-level alias for the framework-reserved `p:start` command. Lazy delegate resolution —
 * see `HelpAliasCommand` for the rationale.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class StartAliasCommand implements CommandInterface<StartCommandOptions> {
  optionsType: StartCommandOptions = new StartCommandOptions();
  name = "start";
  description = "Alias for p:start.";

  constructor(private readonly kernel: Kernel) {
  }

  async run(args: StartCommandOptions): Promise<ExitCodeEnum | number> {
    return this.kernel.container.resolve(StartCommand).run(args);
  }
}
