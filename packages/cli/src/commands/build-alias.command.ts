import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {Kernel} from "@pristine-ts/core";
import {CommandInterface} from "../interfaces/command.interface";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {BuildCommand} from "./build.command";

/**
 * Top-level alias for the framework-reserved `p:build` command. Lazy delegate resolution —
 * see `HelpAliasCommand` for the rationale.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class BuildAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "build";
  description = "Alias for p:build.";

  constructor(private readonly kernel: Kernel) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    return this.kernel.container.resolve(BuildCommand).run(args);
  }
}
