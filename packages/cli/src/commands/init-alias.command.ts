import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {Kernel} from "@pristine-ts/core";
import {CommandInterface} from "../interfaces/command.interface";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {InitCommand} from "./init.command";
import {InitCommandOptions} from "./init.command-options";

/**
 * Top-level alias for the framework-reserved `p:init` command. Lazy delegate resolution —
 * see `HelpAliasCommand` for the rationale.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class InitAliasCommand implements CommandInterface<InitCommandOptions> {
  optionsType = InitCommandOptions;
  name = "init";
  description = "Alias for p:init.";

  constructor(private readonly kernel: Kernel) {
  }

  async run(args: InitCommandOptions): Promise<ExitCodeEnum | number> {
    return this.kernel.container.resolve(InitCommand).run(args);
  }
}
